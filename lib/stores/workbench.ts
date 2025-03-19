import { atom, map, type MapStore, type ReadableAtom, type WritableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '@/components/editor/codemirror/CodeMirrorEditor';
import { ActionRunner } from '@/lib/runtime/action-runner';
import type { ActionCallbackData, ArtifactCallbackData } from '@/lib/runtime/message-parser';
import { webcontainer } from '@/lib/webcontainer';
import type { ITerminal } from '@/types/terminal';
import { unreachable } from '@/utils/unreachable';
import { EditorStore } from './editor';
import { FilesStore, type FileMap } from './files';
import { PreviewsStore } from './previews';
import { TerminalStore } from './terminal';
import JSZip from 'jszip';
import fileSaver from 'file-saver';
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import { path } from '@/utils/path';
import { extractRelativePath } from '@/utils/diff';
import { description } from '@/lib/persistence';
import Cookies from 'js-cookie';
import { createSampler } from '@/utils/sampler';
import type { ActionAlert } from '@/types/actions';

import { appId} from '@/lib/persistence/useChatHistory'

// Destructure saveAs from the CommonJS module
const { saveAs } = fileSaver;

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner;
}

export type ArtifactUpdateState = Pick<ArtifactState, 'title' | 'closed'>;

type Artifacts = MapStore<Record<string, ArtifactState>>;

export type WorkbenchViewType = 'code' | 'preview';


export class WorkbenchStore {
  #previewsStore = new PreviewsStore(webcontainer);
  #filesStore = new FilesStore(webcontainer);
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore(webcontainer);

  #reloadedMessages = new Set<string>();
  #pendingFileUpdates = new Map<string, string>(); // 缓存待更新的文件
  #fileUpdateTimer: number | null = null; // 批处理定时器

  artifacts: Artifacts = map({});
  startStreaming: WritableAtom<boolean> = atom(false);
  tmpFiles: WritableAtom<{ path: string, content: string }[]> = atom([]);

  genType: WritableAtom<string> = atom('');

  deploymentStatus: WritableAtom<'pending' | 'completed' | null> = atom(null);

  isFirstDeploy: WritableAtom<boolean> = atom(false);

  hasSendLLM: WritableAtom<boolean> = atom(false);

  installDependencies: WritableAtom<string> = atom('');

  showWorkbench: WritableAtom<boolean> = atom(false);
  currentView: WritableAtom<WorkbenchViewType> = atom('code');
  unsavedFiles: WritableAtom<Set<string>> = atom(new Set<string>());
  actionAlert: WritableAtom<ActionAlert | undefined> = atom<ActionAlert | undefined>(undefined);
  modifiedFiles = new Set<string>();
  artifactIdList: string[] = [];
  #globalExecutionQueue = Promise.resolve();
  constructor() {}

  addToExecutionQueue(callback: () => Promise<void>) {
    this.#globalExecutionQueue = this.#globalExecutionQueue.then(() => callback());
  }

  get previews() {
    return this.#previewsStore.previews;
  }

  get files() {
    return this.#filesStore.files;
  }

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.#getArtifact(this.artifactIdList[0]);
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  get showTerminal() {
    return this.#terminalStore.showTerminal;
  }
  get boltTerminal() {
    return this.#terminalStore.boltTerminal;
  }
  get alert() {
    return this.actionAlert;
  }
  clearAlert() {
    this.actionAlert.set(undefined);
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  attachTerminal(terminal: ITerminal) {
    this.#terminalStore.attachTerminal(terminal);
  }
  attachBoltTerminal(terminal: ITerminal) {
    this.#terminalStore.attachBoltTerminal(terminal);
  }

  onTerminalResize(cols: number, rows: number) {
    this.#terminalStore.onTerminalResize(cols, rows);
  }

  setDocuments(files: FileMap) {
    this.#editorStore.setDocuments(files);

    if (this.#filesStore.filesCount > 0 && this.currentDocument.get() === undefined) {
      // we find the first file and select it
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.currentDocument.get()?.filePath;

    if (!filePath) {
      return;
    }

    const originalContent = this.#filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#editorStore.updateFile(filePath, newContent);

    const currentDocument = this.currentDocument.get();

    if (currentDocument) {
      const previousUnsavedFiles = this.unsavedFiles.get();

      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.unsavedFiles.set(newUnsavedFiles);
    }
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.currentDocument.get();

    if (!editorDocument) {
      return;
    }

    const { filePath } = editorDocument;

    this.#editorStore.updateScrollPosition(filePath, position);
  }

  setSelectedFile(filePath: string | undefined) {
    this.#editorStore.setSelectedFile(filePath);
  }

  async saveFile(filePath: string) {
    const documents = this.#editorStore.documents.get();
    const document = documents[filePath];

    if (document === undefined) {
      return;
    }

    await this.#filesStore.saveFile(filePath, document.value);

    const newUnsavedFiles = new Set(this.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);

    this.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    await this.saveFile(currentDocument.filePath);
  }

  resetCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    const { filePath } = currentDocument;
    const file = this.#filesStore.getFile(filePath);

    if (!file) {
      return;
    }

    this.setCurrentDocumentContent(file.content);
  }

  async saveAllFiles() {
    for (const filePath of this.unsavedFiles.get()) {
      await this.saveFile(filePath);
    }
  }

  getFileModifcations() {
    return this.#filesStore.getFileModifications();
  }

  resetAllFileModifications() {
    this.#filesStore.resetFileModifications();
  }

  resetGeneratedFiles() {
    this.#filesStore.resetGeneratedFiles();
  }

  getGeneratedFiles() {
    return this.#filesStore.getGeneratedFiles();
  }

  setGeneratedFile(filePath: string) {
    this.#filesStore.setGeneratedFile(filePath);
  }

  abortAllActions() {
    // TODO: what do we wanna do and how do we wanna recover from this?
  }

  setReloadedMessages(messages: string[]) {
    this.#reloadedMessages = new Set(messages);
  }

  addArtifact({ messageId, title, id, type }: ArtifactCallbackData) {
    const artifact = this.#getArtifact(messageId);

    if (artifact) {
      return;
    }

    if (!this.artifactIdList.includes(messageId)) {
      this.artifactIdList.push(messageId);
    }

    this.artifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      runner: new ActionRunner(
        webcontainer,
        () => this.boltTerminal,
        (alert) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          this.actionAlert.set(alert);
        },
      ),
    });
  }

  updateArtifact({ messageId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      return;
    }

    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }
  addAction(data: ActionCallbackData) {
    // this._addAction(data);

    this.addToExecutionQueue(() => this._addAction(data));
  }
  async _addAction(data: ActionCallbackData) {
    const { messageId } = data;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    return artifact.runner.addAction(data);
  }

  runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    if (isStreaming) {
      this.actionStreamSampler(data, isStreaming);
    } else {
      this.addToExecutionQueue(() => this._runAction(data, isStreaming));
    }
  }
  async _runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { messageId } = data;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const action = artifact.runner.actions.get()[data.actionId];

    if (!action || action.executed) {
      return;
    }

    // 使用 requestIdleCallback 或 setTimeout 延迟非关键操作
    const delayNonCriticalOperation = (callback: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => callback(), { timeout: 500 });
      } else {
        setTimeout(callback, 0);
      }
    };

    if (data.action.type === 'file') {
      // const wc = await webcontainer;
      const fullPath = path.join('/home/project', data.action.filePath);

      // 延迟执行非关键的 UI 更新操作
      delayNonCriticalOperation(() => {
        if (this.selectedFile.value !== fullPath) {
          this.setSelectedFile(fullPath);
        }
  
        if (this.currentView.value !== 'code' && this.hasSendLLM.get()) {
          this.currentView.set('code');
        }
      });

      const doc = this.#editorStore.documents.get()[fullPath];

      if (!doc) {
        await artifact.runner.runAction(data, isStreaming);
      }

      // 使用批处理更新文件，而不是立即更新
      this.#pendingFileUpdates.set(fullPath, data.action.content);
      this.batchUpdateFiles();

      if (!isStreaming) {
        await artifact.runner.runAction(data);
        // 延迟执行非关键操作
        delayNonCriticalOperation(() => {
          this.resetAllFileModifications();
        });
      }
    } else {
      await artifact.runner.runAction(data);
    }
  }

  actionStreamSampler = createSampler(async (data: ActionCallbackData, isStreaming: boolean = false) => {
    return await this._runAction(data, isStreaming);
  }, 300); // 增加采样间隔，从100ms改为300ms

  #getArtifact(id: string) {
    const artifacts = this.artifacts.get();
    return artifacts[id];
  }

  async downloadZip() {
    const zip = new JSZip();
    const files = this.files.get();

    // Get the project name from the description input, or use a default name
    const projectName = (description.value ?? 'project').toLocaleLowerCase().split(' ').join('_');

    // Generate a simple 6-character hash based on the current timestamp
    const timestampHash = Date.now().toString(36).slice(-6);
    const uniqueProjectName = `${projectName}_${timestampHash}`;

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);

        // split the path into segments
        const pathSegments = relativePath.split('/');

        // if there's more than one segment, we need to create folders
        if (pathSegments.length > 1) {
          let currentFolder = zip;

          for (let i = 0; i < pathSegments.length - 1; i++) {
            currentFolder = currentFolder.folder(pathSegments[i])!;
          }
          currentFolder.file(pathSegments[pathSegments.length - 1], dirent.content);
        } else {
          // if there's only one segment, it's a file in the root
          zip.file(relativePath, dirent.content);
        }
      }
    }

    // Generate the zip file and save it
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${uniqueProjectName}.zip`);
  }

  async syncFiles(targetHandle: FileSystemDirectoryHandle) {
    const files = this.files.get();
    const syncedFiles = [];

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);
        const pathSegments = relativePath.split('/');
        let currentHandle = targetHandle;

        for (let i = 0; i < pathSegments.length - 1; i++) {
          currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], { create: true });
        }

        // create or get the file
        const fileHandle = await currentHandle.getFileHandle(pathSegments[pathSegments.length - 1], {
          create: true,
        });

        // write the file content
        const writable = await fileHandle.createWritable();
        await writable.write(dirent.content);
        await writable.close();

        syncedFiles.push(relativePath);
      }
    }

    return syncedFiles;
  }

  async pushToGitHub(
    repoName: string,
    commitMessage?: string,
    githubUsername?: string,
    ghToken?: string,
    isPrivate: boolean = false,
  ) {
    try {
      // Use cookies if username and token are not provided
      const githubToken = ghToken || Cookies.get('githubToken');
      const owner = githubUsername || Cookies.get('githubUsername');

      if (!githubToken || !owner) {
        throw new Error('GitHub token or username is not set in cookies or provided.');
      }

      // Initialize Octokit with the auth token
      const octokit = new Octokit({ auth: githubToken });

      // Check if the repository already exists before creating it
      let repo: RestEndpointMethodTypes['repos']['get']['response']['data'];

      try {
        const resp = await octokit.repos.get({ owner, repo: repoName });
        repo = resp.data;
      } catch (error) {
        if (error instanceof Error && 'status' in error && error.status === 404) {
          // Repository doesn't exist, so create a new one
          const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: isPrivate,
            auto_init: true,
          });
          repo = newRepo;
        } else {
          console.log('cannot create repo!');
          throw error; // Some other error occurred
        }
      }

      // Get all files
      const files = this.files.get();

      if (!files || Object.keys(files).length === 0) {
        throw new Error('No files found to push');
      }

      // Create blobs for each file
      const blobs = await Promise.all(
        Object.entries(files).map(async ([filePath, dirent]) => {
          if (dirent?.type === 'file' && dirent.content) {
            const { data: blob } = await octokit.git.createBlob({
              owner: repo.owner.login,
              repo: repo.name,
              content: Buffer.from(dirent.content).toString('base64'),
              encoding: 'base64',
            });
            return { path: extractRelativePath(filePath), sha: blob.sha };
          }

          return null;
        }),
      );

      const validBlobs = blobs.filter(Boolean); // Filter out any undefined blobs

      if (validBlobs.length === 0) {
        throw new Error('No valid files to push');
      }

      // Get the latest commit SHA (assuming main branch, update dynamically if needed)
      const { data: ref } = await octokit.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch || 'main'}`, // Handle dynamic branch
      });
      const latestCommitSha = ref.object.sha;

      // Create a new tree
      const { data: newTree } = await octokit.git.createTree({
        owner: repo.owner.login,
        repo: repo.name,
        base_tree: latestCommitSha,
        tree: validBlobs.map((blob) => ({
          path: blob!.path,
          mode: '100644',
          type: 'blob',
          sha: blob!.sha,
        })),
      });

      // Create a new commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner: repo.owner.login,
        repo: repo.name,
        message: commitMessage || 'Initial commit from your app',
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update the reference
      await octokit.git.updateRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch || 'main'}`, // Handle dynamic branch
        sha: newCommit.sha,
      });

      return repo.html_url; // Return the URL instead of showing alert
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      throw error; // Rethrow the error for further handling
    }
  }

  async uploadFilesTomachine(files: { path: string, content: string }[], installDependencies: string) {

    try {
        this.currentView.set('preview');
        const response = await fetch('/api/deploy-to-machine', {
          method: 'POST',
          body: JSON.stringify({
            appName: appId.get(),
            files: files,
            installDependencies: installDependencies,
          }),
        });

        if (!response.ok || !response.body) {
          this.tmpFiles.set(files);
          this.actionAlert.set({
            type: 'machine',
            title: 'Error uploading files to machine',
            description: 'Error occurred at upload Files To Machine',
            content: "Error occurred at upload Files To Machine",
            source: 'preview',
          });
          return;
        }


        const handleStream = (result: any) => {
          if (result.event === 'complete') {
            workbenchStore.installDependencies.set('');

            workbenchStore.previews.set([{
              port: 3000,
              ready: true,
              baseUrl: `https://${appId.get()}.fly.dev/`,
              isLoading: true,
              loadingProgress: 0
            }]);
            
            this.setIsFirstDeploy(false);
          }

          if (result.event === 'error') {
            this.tmpFiles.set(files);
            this.actionAlert.set({
              type: 'machine',
              title: 'Error uploading files to machine',
              description: 'Error occurred at upload Files To Machine',
              content: "Error occurred at upload Files To Machine",
              source: 'preview',
            });
          }
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          console.log('deploy data: ', text);
          try {
            const lines = text.split("\n");
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = JSON.parse(line.substring(6)) as Record<string, any>; // remove data: and parse as json
                handleStream(data?.data);
              }
            }
          } catch (e) {
            console.warn('Error parsing stream data:', e);
          }         
        }

        // this.reloadPreview();

    } catch (error) {
      console.error('Error uploading files to machine:', error);
    }
  }

  setDeploymentStatus(status: 'pending' | 'completed' | null) {
    this.deploymentStatus.set(status);
  }

  setIsFirstDeploy(isFirstDeploy: boolean) {
    this.isFirstDeploy.set(isFirstDeploy);
  }

  reloadPreview() {
    this.setLoadingState(true, 0);
    this.#previewsStore.reloadPreview();
  }

  setLoadingState(loading: boolean, progress: number = 0) {
    this.#previewsStore.setLoadingState(loading, progress);
  }

  updateLoadingProgress(progress: number) {
    this.#previewsStore.updateLoadingProgress(progress);
  }

  // 批量更新文件
  batchUpdateFiles() {
    if (this.#fileUpdateTimer !== null) {
      return;
    }

    this.#fileUpdateTimer = window.setTimeout(() => {
      const updates = new Map(this.#pendingFileUpdates);
      this.#pendingFileUpdates.clear();
      this.#fileUpdateTimer = null;

      // 批量处理所有文件更新
      for (const [filePath, content] of updates.entries()) {
        this.#editorStore.updateFile(filePath, content);
        // this.#filesStore.setGeneratedFile(filePath);
      }
    }, 50); // 50ms 批处理间隔
  }
}

export const workbenchStore = new WorkbenchStore();
