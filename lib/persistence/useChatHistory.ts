import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { atom } from 'nanostores';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '@/lib/stores/workbench';
import { logStore } from '@/lib/stores/logs';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import type { IChatMetadata } from './types';
import { debounce } from 'lodash-es';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: IChatMetadata;
}

const persistenceEnabled = true;

export const chatId = atom<string | undefined>(undefined);
export const appId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<IChatMetadata | undefined>(undefined);


const debouncedSaveChat = debounce(async (params: {
  id: string | undefined;
  messages: Message[];
  urlId: string | undefined;
  description: string | undefined;
  metadata: IChatMetadata | undefined;
}) => {
  await fetch('/api/chats', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}, 1000);

export function useChatHistory() {
  // 替换 useNavigate
  const router = useRouter();
  
  // 替换 useLoaderData
  const params = useParams();
  const mixedId = params?.id as string | undefined;
  
  const searchParams = useSearchParams();

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  useEffect(() => {
    if (!persistenceEnabled) {
      setReady(true);
      return;
    }

    if (mixedId) {
      fetch(`/api/chats/${mixedId}`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Failed to load chat');
          }
          return response.json();
        })
        .then((storedMessages: ChatHistoryItem) => {
          if (storedMessages && storedMessages.messages.length > 0) {
            const rewindId = searchParams?.get?.('rewindTo');
            const filteredMessages = rewindId
              ? storedMessages.messages.slice(0, storedMessages.messages.findIndex((m) => m.id === rewindId) + 1)
              : storedMessages.messages;

            setInitialMessages(filteredMessages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);
            appId.set(`app-${storedMessages.id}`);
            workbenchStore.setDeploymentStatus('completed');
            workbenchStore.previews.set([{
              port: 3000,
              ready: true,
              baseUrl: `https://${appId.get()}.fly.dev/`,
              isLoading: true,
              loadingProgress: 0
            }]);
            chatMetadata.set(storedMessages.metadata);
          } else {
            router.push('/');
          }
          setReady(true);
        })
        .catch((error) => {
          logStore.logError('Failed to load chat messages', error);
          toast.error(error.message);
          setReady(true);
        });
    }
  }, [mixedId]);


  return {
    ready: !mixedId || ready,
    initialMessages,
    updateChatMestaData: async (metadata: IChatMetadata) => {
      const id = chatId.get();
      if (!id) return;

      try {
        const response = await fetch('/api/chats/metadata', {
          method: 'PUT',
          body: JSON.stringify({ id, metadata }),
        });
        
        if (!response.ok) throw new Error('Failed to update metadata');
        chatMetadata.set(metadata);
      } catch (error) {
        toast.error('Failed to update chat metadata');
        console.error(error);
      }
    },
    storeMessageHistory: async (messages: Message[]) => {
      if (messages.length === 0) return;

      const { firstArtifact } = workbenchStore;
      const currentId = chatId.get();

      try {
        if (!urlId && firstArtifact?.id) {
          const urlId = nanoid();
          navigateChat(urlId);
          setUrlId(urlId);
        }

        if (!description.get() && firstArtifact?.title) {
          description.set(firstArtifact?.title);
        }

        if (initialMessages.length === 0 && !currentId) {
          const newId = uuidv4();
          chatId.set(newId);
          const appName = `app-${newId}`;
          appId.set(appName);
          workbenchStore.resetGeneratedFiles();
          workbenchStore.setDeploymentStatus('pending');
          
          await fetch('/api/deploy', {
            method: 'POST',
            body: JSON.stringify({ appName }),
          });
          
          workbenchStore.setDeploymentStatus('completed');

          if (!urlId) {
            navigateChat(newId);
          }
        }

        const saveParams = {
          id: chatId.get(),
          messages,
          urlId,
          description: description.get(),
          metadata: chatMetadata.get()
        };
        
        await debouncedSaveChat(saveParams);
      } catch (error) {
        toast.error('Failed to save chat');
        console.error(error);
      }
    },
    duplicateCurrentChat: async (listItemId: string) => {
      if (!mixedId && !listItemId) return;

      try {
        const response = await fetch('/api/chats/duplicate', {
          method: 'POST',
          body: JSON.stringify({ id: mixedId || listItemId }),
        });
        
        if (!response.ok) throw new Error('Failed to duplicate chat');
        const { urlId: newId } = await response.json();
        
        router.push(`/chat/${newId}`);
        toast.success('Chat duplicated successfully');
      } catch (error) {
        toast.error('Failed to duplicate chat');
        console.error(error);
      }
    },
    importChat: async (description: string, messages: Message[], metadata?: IChatMetadata) => {
      try {
        const response = await fetch('/api/chats/import', {
          method: 'POST',
          body: JSON.stringify({ description, messages, metadata }),
        });
        
        if (!response.ok) throw new Error('Failed to import chat');
        const { urlId: newId } = await response.json();
        
        window.location.href = `/chat/${newId}`;
        toast.success('Chat imported successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to import chat');
      }
    },
    exportChat: async (id = urlId) => {
      if (!id) return;

      try {
        const response = await fetch(`/api/chats/export/${id}`);
        if (!response.ok) throw new Error('Failed to export chat');
        
        const chatData = await response.json();
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        toast.error('Failed to export chat');
        console.error(error);
      }
    },
  };
}

function navigateChat(nextId: string) {
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;
  window.history.replaceState({}, '', url);
}
