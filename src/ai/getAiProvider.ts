import { env } from '../lib/env';
import { AiProvider } from './AiProvider';
import { GeminiProvider } from './geminiProvider';
import { ClaudeProvider } from './claudeProvider';

let providerInstance: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (providerInstance) {
    return providerInstance;
  }

  if (env.AI_PROVIDER === 'gemini') {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required to initialize GeminiProvider');
    }
    providerInstance = new GeminiProvider(env.GEMINI_API_KEY, env.AI_MODEL);
    return providerInstance;
  }

  if (env.AI_PROVIDER === 'claude') {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required to initialize ClaudeProvider');
    }
    providerInstance = new ClaudeProvider(env.ANTHROPIC_API_KEY, env.AI_MODEL);
    return providerInstance;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
}
