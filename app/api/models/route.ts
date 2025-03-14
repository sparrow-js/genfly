import { NextResponse } from 'next/server';
import { LLMManager } from '@/lib/modules/llm/manager';
import type { ModelInfo } from '@/lib/modules/llm/types';
import type { ProviderInfo } from '@/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '@/lib/api/cookies';

interface ModelsResponse {
  modelList: ModelInfo[];
  providers: ProviderInfo[];
  defaultProvider: ProviderInfo;
}

let cachedProviders: ProviderInfo[] | null = null;
let cachedDefaultProvider: ProviderInfo | null = null;

function getProviderInfo(llmManager: LLMManager) {
  if (!cachedProviders) {
    cachedProviders = llmManager.getAllProviders().map((provider) => ({
      name: provider.name,
      staticModels: provider.staticModels,
      getApiKeyLink: provider.getApiKeyLink,
      labelForGetApiKey: provider.labelForGetApiKey,
      icon: provider.icon,
    }));
  }

  if (!cachedDefaultProvider) {
    const defaultProvider = llmManager.getDefaultProvider();
    cachedDefaultProvider = {
      name: defaultProvider.name,
      staticModels: defaultProvider.staticModels,
      getApiKeyLink: defaultProvider.getApiKeyLink,
      labelForGetApiKey: defaultProvider.labelForGetApiKey,
      icon: defaultProvider.icon,
    };
  }

  return { providers: cachedProviders, defaultProvider: cachedDefaultProvider };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || undefined;

  // For Cloudflare env in Next.js, you might need to adjust this based on your setup
  const env = process.env as Record<string, string>;
  const llmManager = LLMManager.getInstance(env);

  // Get client side maintained API keys and provider settings from cookies
  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  const { providers, defaultProvider } = getProviderInfo(llmManager);

  let modelList: ModelInfo[] = [];

  if (provider) {
    // Only update models for the specific provider
    const providerInstance = llmManager.getProvider(provider);

    if (providerInstance) {
      modelList = await llmManager.getModelListFromProvider(providerInstance, {
        apiKeys,
        providerSettings,
        serverEnv: env,
      });
    }
  } else {
    // Update all models
    modelList = await llmManager.updateModelList({
      apiKeys,
      providerSettings,
      serverEnv: env,
    });
  }

  return NextResponse.json<ModelsResponse>({
    modelList,
    providers,
    defaultProvider,
  });
}