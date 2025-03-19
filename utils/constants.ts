import { LLMManager } from '@/lib/modules/llm/manager';
import type { Template } from '@/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const llmManager = LLMManager.getInstance();

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'vite-ts-template',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'sparrow-js/vite-ts-template',
    tags: ['react', 'vite', 'frontend'],
    icon: 'i-bolt:react',
    categorys: ['Landing Page', 'Marketing', 'Information Display']
  },
  {
    name: 'vite-ts-sass-template',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'sparrow-js/vite-ts-sass-template',
    tags: ['react', 'vite', 'frontend'],
    icon: 'i-bolt:react',
    categorys: ['SaaS System', 'Cloud Management System', 'Subscription Service System', 'Dashboard System', "Productivity Tool"]
  }
];
