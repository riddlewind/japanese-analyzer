export type AIProvider = 'gemini' | 'deepseek' | 'sensenova' | 'qiniu';
export type GeminiModelName = 'gemini-flash-latest' | 'gemini-flash-lite-latest';
export type DeepSeekModelName = 'deepseek-flash';
export type SenseNovaModelName = 'sensenova-6.8-flash-lite';
export type QiniuModelName = 'moonshotai/kimi-k3-free';
export type AIModelName = SenseNovaModelName | GeminiModelName | DeepSeekModelName | QiniuModelName;
export type ImageRecognitionModelName = SenseNovaModelName | GeminiModelName | typeof DEEPSEEK_VISION_MODEL_NAME | QiniuModelName;

export const DEFAULT_AI_PROVIDER: AIProvider = 'sensenova';
export const GEMINI_MODEL_NAME: GeminiModelName = 'gemini-flash-latest';
export const DEEPSEEK_MODEL_NAME: DeepSeekModelName = 'deepseek-flash';
export const DEEPSEEK_VISION_MODEL_NAME = DEEPSEEK_MODEL_NAME;
export const GEMINI_MODEL_OPTIONS: GeminiModelName[] = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
export const DEEPSEEK_MODEL_OPTIONS: DeepSeekModelName[] = ['deepseek-flash'];
export const SENSENOVA_MODEL_NAME: SenseNovaModelName = 'sensenova-6.8-flash-lite';
export const SENSENOVA_MODEL_OPTIONS: SenseNovaModelName[] = ['sensenova-6.8-flash-lite'];
export const QINIU_MODEL_NAME: QiniuModelName = 'moonshotai/kimi-k3-free';
export const QINIU_MODEL_OPTIONS: QiniuModelName[] = ['moonshotai/kimi-k3-free'];
export function normalizeAIProvider(value?: unknown): AIProvider {
  return value === 'sensenova' || value === 'gemini' || value === 'deepseek' || value === 'qiniu' ? value : DEFAULT_AI_PROVIDER;
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

  if (provider === 'qiniu') {
    return QINIU_MODEL_OPTIONS.includes(model as QiniuModelName)
      ? model as QiniuModelName
      : QINIU_MODEL_NAME;
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
  if (provider === 'qiniu') {
    return normalizeAIModel('qiniu', model) as QiniuModelName;
  }
  return normalizeAIModel('gemini', model) as GeminiModelName;
}
