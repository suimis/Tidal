import { Model } from '@/lib/types/models';
import defaultModels from './default-models.json';

export function validateModel(model: unknown): model is Model {
  if (typeof model !== 'object' || model === null) {
    return false;
  }

  const m = model as Record<string, unknown>;

  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.provider === 'string' &&
    typeof m.providerId === 'string' &&
    typeof m.enabled === 'boolean' &&
    (m.toolCallType === 'native' || m.toolCallType === 'manual') &&
    (m.toolCallModel === undefined || typeof m.toolCallModel === 'string')
  );
}

export async function getModels(): Promise<Model[]> {
  try {
    // Use environment variable or default URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const baseUrlObj = new URL(baseUrl);
    const modelUrl = new URL('/config/models.json', baseUrlObj);
    console.log('Attempting to fetch models from:', modelUrl.toString());

    try {
      const response = await fetch(modelUrl, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(
          `HTTP error when fetching models: ${response.status} ${response.statusText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      // Check if the response starts with HTML doctype
      if (text.trim().toLowerCase().startsWith('<!doctype')) {
        console.warn('Received HTML instead of JSON when fetching models');
        throw new Error('Received HTML instead of JSON');
      }

      const config = JSON.parse(text);
      if (Array.isArray(config.models) && config.models.every(validateModel)) {
        console.log('Successfully loaded models from URL');
        return config.models;
      }
    } catch (error: unknown) {
      // Fallback to default models if fetch fails
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        'Fetch failed, falling back to default models:',
        errorMessage
      );

      if (
        Array.isArray(defaultModels.models) &&
        defaultModels.models.every(validateModel)
      ) {
        console.log('Successfully loaded default models');
        return defaultModels.models;
      }
    }
  } catch (error) {
    console.warn('Failed to load models:', error);
  }

  // Last resort: return empty array
  console.warn('All attempts to load models failed, returning empty array');
  return [];
}
