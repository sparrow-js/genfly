import { BaseProvider } from '@/lib/modules/llm/base-provider';
import type { ModelInfo } from '@/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createAnthropic } from '@ai-sdk/anthropic';

export default class AnthropicProvider extends BaseProvider {
  name = 'Anthropic';
  getApiKeyLink = 'https://console.anthropic.com/settings/keys';

  config = {
    apiTokenKey: 'ANTHROPIC_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'claude-3-7-sonnet-20250219',
      label: 'Claude 3.7 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-5-sonnet-latest',
      label: 'Claude 3.5 Sonnet (new)',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-5-sonnet-20240620',
      label: 'Claude 3.5 Sonnet (old)',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-5-haiku-latest',
      label: 'Claude 3.5 Haiku (new)',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
  ];
  getModelInstance: (options: {
    model: string;
    serverEnv?: Record<string, string>;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });
    // const anthropic = createAnthropic({
    //   apiKey: "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",
    //   baseURL: "https://openrouter.ai/api/v1"
    // });

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.openai-proxy.org/anthropic/v1',
    });

    return anthropic(model);
  };
}
