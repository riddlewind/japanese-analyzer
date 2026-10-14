export type AIProvider = 'gemini' | 'deepseek' | 'sensenova';
export type GeminiModelName = 'gemini-flash-latest' | 'gemini-flash-lite-latest';
export type DeepSeekModelName = 'deepseek-flash';
export type SenseNovaModelName = 'sensenova-6.8-flash-lite';
export type AIModelName = SenseNovaModelName | GeminiModelName | DeepSeekModelName;
export type ImageRecognitionModelName = SenseNovaModelName | GeminiModelName | typeof DEEPSEEK_VISION_MODEL_NAME;

export const DEFAULT_AI_PROVIDER: AIProvider = 'deepseek';
export const GEMINI_MODEL_NAME: GeminiModelName = 'gemini-flash-latest';
export const DEEPSEEK_MODEL_NAME: DeepSeekModelName = 'deepseek-flash';
export const DEEPSEEK_VISION_MODEL_NAME = DEEPSEEK_MODEL_NAME;
export const GEMINI_MODEL_OPTIONS: GeminiModelName[] = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
export const DEEPSEEK_MODEL_OPTIONS: DeepSeekModelName[] = ['deepseek-flash'];
export const SENSENOVA_MODEL_NAME: SenseNovaModelName = 'sensenova-6.8-flash-lite';
export const SENSENOVA_MODEL_OPTIONS: SenseNovaModelName[] = ['sensenova-6.8-flash-lite'];
export function normalizeAIProvider(value?: unknown): AIProvider {
  return value === 'sensenova' || value === 'gemini' || value === 'deepseek' ? value : DEFAULT_AI_PROVIDER;
}

export function normalizeAIModel(
  provider: AIProvider = DEFAULT_AI_PROVIDER,
  value?: unknown
): AIModelName {
  const model = typeof value === 'string' ? value.trim() : '';

  if (provider === 'deepseek') {
    return DEEPSEEK_MODEL_OPTIONS.includes(model as DeepSeekModelName)
      ? model as DeepSeekModelName
      : DEEPSEEK_MODEL_NAME;
  }
  
  if (provider === 'sensenova') {
    return SENSENOVA_MODEL_OPTIONS.includes(model as SenseNovaModelName)
      ? model as SenseNovaModelName
      : SENSENOVA_MODEL_NAME;
  }

  if (model === 'gemini-3.7-flash') return 'gemini-flash-latest';
  if (model === 'gemini-3.5-flash-lite') return 'gemini-flash-lite-latest';

  return GEMINI_MODEL_OPTIONS.includes(model as GeminiModelName)
    ? model as GeminiModelName
    : GEMINI_MODEL_NAME;
}

export function getModelName(
  provider: AIProvider = DEFAULT_AI_PROVIDER,
  model?: unknown
): AIModelName {
  return normalizeAIModel(provider, model);
}

export function getImageRecognitionModelName(
  provider: AIProvider = DEFAULT_AI_PROVIDER,
  model?: unknown
): ImageRecognitionModelName {
  if (provider === 'deepseek') return DEEPSEEK_VISION_MODEL_NAME;
  if (provider === 'sensenova') {
    return normalizeAIModel('sensenova', model) as SenseNovaModelName;
  }
  return normalizeAIModel('gemini', model) as GeminiModelName;
}
