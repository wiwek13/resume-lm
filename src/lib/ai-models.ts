/**
 * Centralized AI Model Management
 * This file contains all AI model and provider configurations used throughout the application
 */

import { ServiceName } from './types'

// ========================
// Type Definitions
// ========================

export interface AIProvider {
  id: ServiceName
  name: string
  apiLink: string
  logo?: string
  envKey: string
  sdkInitializer: string
  unstable?: boolean
}

export interface AIModel {
  id: string
  name: string
  provider: ServiceName
  features: {
    isFree?: boolean
    isRecommended?: boolean
    isUnstable?: boolean
    isCustom?: boolean  // User-defined custom model
    maxTokens?: number
    supportsVision?: boolean
    supportsTools?: boolean
    isPro?: boolean
  }
  availability: {
    requiresApiKey: boolean
    requiresPro: boolean
  }
}

export interface ApiKey {
  service: ServiceName
  key: string
  addedAt: string
}

export interface AIConfig {
  model: string
  apiKeys: ApiKey[]
  customPrompts?: import('./types').CustomPrompts
}

export interface GroupedModels {
  provider: ServiceName
  name: string
  models: AIModel[]
}

/**
 * Interface for user-defined custom models (stored in localStorage)
 */
export interface CustomModelInput {
  id: string
  name: string
  addedAt: string
}

/**
 * Creates an AIModel object from a custom model input.
 * Custom models are assumed to be OpenRouter models.
 */
export function createCustomAIModel(custom: CustomModelInput): AIModel {
  return {
    id: custom.id,
    name: custom.name,
    provider: 'openrouter',
    features: {
      isCustom: true, // Mark as custom for UI display
      isRecommended: false,
      isUnstable: false,
      supportsTools: true,
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false,
    },
  }
}

// ========================
// Provider Configurations
// ========================

export const PROVIDERS: Partial<Record<ServiceName, AIProvider>> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiLink: 'https://console.anthropic.com/',
    logo: '/logos/claude.png',
    envKey: 'ANTHROPIC_API_KEY',
    sdkInitializer: 'anthropic',
    unstable: false
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiLink: 'https://platform.openai.com/api-keys',
    logo: '/logos/chat-gpt-logo.png',
    envKey: 'OPENAI_API_KEY',
    sdkInitializer: 'openai',
    unstable: false
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    apiLink: 'https://openrouter.ai/account/api-keys',
    logo: '/logos/gemini-logo.webp',
    envKey: 'OPENROUTER_API_KEY',
    sdkInitializer: 'openrouter',
    unstable: false

  },
}

// ========================
// Model Definitions
// ========================

export const AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    features: {
      isRecommended: true,
      isUnstable: false,
      maxTokens: 400000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: 'openai',
    features: {
      isRecommended: false,
      isUnstable: false,
      maxTokens: 400000,
      supportsVision: true,
      supportsTools: true,
      isPro: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: true
    }
  },
  {
    id: 'gpt-5.1-chat',
    name: 'GPT-5.1',
    provider: 'openai',
    features: {
      isRecommended: false,
      isUnstable: false,
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    provider: 'openai',
    features: {
      isRecommended: false,
      isUnstable: false,
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'openrouter',
    features: {
      isRecommended: true,
      isUnstable: false,
      maxTokens: 1000000,
      supportsVision: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'openrouter',
    features: {
      isRecommended: false,
      isUnstable: false,
      isFree: true,
      maxTokens: 131072,
      supportsVision: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'openrouter',
    features: {
      isRecommended: false,
      isUnstable: false,
      isFree: true,
      maxTokens: 131072,
      supportsVision: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'z-ai/glm-4.6:exacto',
    name: 'GLM-4.6 Exacto',
    provider: 'openrouter',
    features: {
      isRecommended: false,
      isUnstable: false,
      supportsVision: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: true,
      isUnstable: false,
      maxTokens: 64000,
      supportsVision: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },

  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: true,
      isUnstable: false,
      maxTokens: 1000000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },
  {
    id: 'nex-agi/deepseek-v3.1-nex-n1:free',
    name: 'DeepSeek V3.1 Nex N1 (Free)',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: true,
      isUnstable: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Mistral Devstral (Free)',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: false,
      isUnstable: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2:free',
    name: 'Nvidia Nemotron Nano 9B (Free)',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: false,
      isUnstable: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air (Free)',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: false,
      isUnstable: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },
  {
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen3 4B (Free)',
    provider: 'openrouter',
    features: {
      isFree: true,
      isRecommended: false,
      isUnstable: false,
      supportsTools: true
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false
    }
  },

  // Anthropic Models
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    features: {
      isRecommended: false,
      isUnstable: false,
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    features: {
      isRecommended: false,
      isUnstable: false,
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    features: {
      isRecommended: false,
      isUnstable: false,
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: false
    }
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    features: {
      isRecommended: true,
      isUnstable: false,
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      isPro: true
    },
    availability: {
      requiresApiKey: true,
      requiresPro: true
    }
  },

]

// ========================
// Legacy ID Aliases
// ========================

// Map legacy or shorthand model IDs to current canonical IDs
const MODEL_ALIASES: Record<string, string> = {
  // Old shorthand → Current Anthropic Sonnet 4 (dated ID)
  'claude-4-sonnet': 'claude-sonnet-4-20250514',
  // Older legacy model not present anymore → best current equivalent
  'claude-3-sonnet-20240229': 'claude-sonnet-4-20250514',
  // Shorthand for Claude Sonnet 4.5
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
  // Shorthand for Claude Opus 4.5
  'claude-opus-4.5': 'claude-opus-4-5-20251101',
  // GPT-5.2 snapshot aliases
  'gpt-5.2-2025-12-11': 'gpt-5.2',
  'gpt-5.2-pro-2025-12-11': 'gpt-5.2-pro',
  // Legacy GPT-5 reference → latest GPT-5.2
  'gpt-5': 'gpt-5.2',
  // Allow DeepSeek without the nitro suffix
  'deepseek/deepseek-v3.2': 'deepseek/deepseek-chat',
  // Legacy Gemini 3 model ID without provider prefix
  'gemini-3-pro-preview': 'google/gemini-3-pro-preview',
}

// ========================
// Default Model Configuration
// ========================

export const DEFAULT_MODELS = {
  PRO_USER: 'nex-agi/deepseek-v3.1-nex-n1:free',
  FREE_USER: 'nex-agi/deepseek-v3.1-nex-n1:free'
} as const

// ========================
// Model Designations for Different Use Cases
// ========================

/**
 * Designated models for specific use cases throughout the application.
 * Change these to update which models are used globally.
 */
export const MODEL_DESIGNATIONS = {
  // Fast & cheap model for parsing, simple tasks, quick analysis
  FAST_CHEAP: 'qwen/qwen3-4b:free',
  // Alternative fast & cheap option (free for all users)
  FAST_CHEAP_FREE: 'qwen/qwen3-4b:free',
  // Frontier model for complex tasks, deep analysis, best quality
  FRONTIER: 'nex-agi/deepseek-v3.1-nex-n1:free',
  // Alternative frontier model
  FRONTIER_ALT: 'mistralai/devstral-2512:free',
  // Balanced model - good quality but faster/cheaper than frontier
  BALANCED: 'z-ai/glm-4.5-air:free',
  // Vision-capable model for image analysis
  VISION: 'google/gemini-2.0-flash-exp:free',
  // Default models by user type
  DEFAULT_PRO: 'nex-agi/deepseek-v3.1-nex-n1:free',
  DEFAULT_FREE: 'nex-agi/deepseek-v3.1-nex-n1:free'
} as const

// Type for model designations
export type ModelDesignation = keyof typeof MODEL_DESIGNATIONS

// ========================
// Utility Functions
// ========================

/**
 * Get all providers as an array
 */
export function getProvidersArray(): AIProvider[] {
  return Object.values(PROVIDERS)
}

/**
 * Get a model by its ID.
 * Optionally search custom models as well.
 */
export function getModelById(id: string, customModels?: CustomModelInput[]): AIModel | undefined {
  const resolvedId = MODEL_ALIASES[id] || id

  // First check built-in models
  const builtIn = AI_MODELS.find(model => model.id === resolvedId)
  if (builtIn) return builtIn

  // Then check custom models
  if (customModels) {
    const custom = customModels.find(m => m.id === resolvedId)
    if (custom) return createCustomAIModel(custom)
  }

  return undefined
}

/**
 * Get a provider by its ID
 */
export function getProviderById(id: ServiceName): AIProvider | undefined {
  return PROVIDERS[id]
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: ServiceName): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider)
}

/**
 * Check if a model is available for a user.
 * Optionally include custom models in the check.
 */
export function isModelAvailable(
  modelId: string,
  isPro: boolean,
  apiKeys: ApiKey[],
  customModels?: CustomModelInput[]
): boolean {
  modelId = MODEL_ALIASES[modelId] || modelId
  // Pro users have access to all models
  if (isPro) return true

  const model = getModelById(modelId, customModels)

  // If model not found in built-in or custom, but it looks like an OpenRouter ID,
  // allow it if user has OpenRouter API key (supports any custom model ID)
  if (!model) {
    if (modelId.includes('/')) {
      return apiKeys.some(key => key.service === 'openrouter')
    }
    return false
  }

  // Free model allowance
  if (model.features.isFree) return true

  // Check if this is an OpenRouter model (contains forward slash)
  if (modelId.includes('/')) {
    return apiKeys.some(key => key.service === 'openrouter')
  }

  // Check if user has the required API key
  return apiKeys.some(key => key.service === model.provider)
}

/**
 * Get the default model for a user type
 */
export function getDefaultModel(isPro: boolean): string {
  return isPro ? DEFAULT_MODELS.PRO_USER : DEFAULT_MODELS.FREE_USER
}

/**
 * Get the provider for a model
 */
export function getModelProvider(modelId: string): AIProvider | undefined {
  const model = getModelById(modelId)
  if (!model) return undefined
  return getProviderById(model.provider)
}

/**
 * Group models by provider for display.
 * Optionally include custom models in the OpenRouter group.
 */
export function groupModelsByProvider(customModels?: CustomModelInput[]): GroupedModels[] {
  const providerOrder: ServiceName[] = ['anthropic', 'openai', 'openrouter']
  const grouped = new Map<ServiceName, AIModel[]>()

  // Group built-in models by provider
  AI_MODELS.forEach(model => {
    if (!grouped.has(model.provider)) {
      grouped.set(model.provider, [])
    }
    grouped.get(model.provider)!.push(model)
  })

  // Add custom models to OpenRouter group
  if (customModels && customModels.length > 0) {
    const openrouterModels = grouped.get('openrouter') || []
    const customAIModels = customModels.map(createCustomAIModel)
    grouped.set('openrouter', [...openrouterModels, ...customAIModels])
  }

  // Return in ordered format
  return providerOrder
    .map(providerId => {
      const provider = getProviderById(providerId)
      if (!provider) return null

      return {
        provider: providerId,
        name: provider.name,
        models: grouped.get(providerId) || []
      }
    })
    .filter((group): group is GroupedModels => group !== null && group.models.length > 0)
}

/**
 * Get selectable models for a user
 */
export function getSelectableModels(isPro: boolean, apiKeys: ApiKey[]): AIModel[] {
  return AI_MODELS.filter(model => isModelAvailable(model.id, isPro, apiKeys))
}

/**
 * Determine which SDK to use for a model
 */
export function getModelSDKConfig(modelId: string): { provider: AIProvider; modelId: string } | undefined {
  const model = getModelById(modelId)
  if (!model) return undefined

  const provider = getProviderById(model.provider)
  if (!provider) return undefined

  return { provider, modelId }
}
