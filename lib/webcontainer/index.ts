import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '@/utils/constants';
import { cleanStackTrace } from '@/utils/stacktrace';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = {
  loaded: false,
};



export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});
