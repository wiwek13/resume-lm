'use client'

import { useSyncExternalStore, useCallback } from 'react'
import type { ApiKey } from '@/lib/ai-models'

// Custom model type for user-defined OpenRouter models
export interface CustomModel {
  id: string           // OpenRouter model ID (e.g., 'deepseek/deepseek-r1:free')
  name: string         // Display name
  addedAt: string      // ISO timestamp
}

// Storage keys - must match existing keys for backwards compatibility
const API_KEYS_STORAGE_KEY = 'resumelm-api-keys'
const MODEL_STORAGE_KEY = 'resumelm-default-model'
const CUSTOM_MODELS_STORAGE_KEY = 'resumelm-custom-models'

// Listener sets for each store
const apiKeysListeners = new Set<() => void>()
const modelListeners = new Set<() => void>()
const customModelsListeners = new Set<() => void>()

// Cached server snapshots for SSR (MUST be cached to avoid infinite loops)
const EMPTY_API_KEYS: ApiKey[] = []
const EMPTY_MODEL = ''
const EMPTY_CUSTOM_MODELS: CustomModel[] = []

// In-memory caches to keep snapshots stable between calls
let currentApiKeys: ApiKey[] = EMPTY_API_KEYS
let currentDefaultModel = EMPTY_MODEL
let currentCustomModels: CustomModel[] = EMPTY_CUSTOM_MODELS

// Track initialization status
let hasInitializedStores = false
let hasAttachedStorageListener = false

// Emit changes to all subscribers
function emitApiKeysChange() {
  apiKeysListeners.forEach(listener => listener())
}

function emitModelChange() {
  modelListeners.forEach(listener => listener())
}

function emitCustomModelsChange() {
  customModelsListeners.forEach(listener => listener())
}

function ensureClientStoresInitialized() {
  if (typeof window === 'undefined') return

  if (!hasInitializedStores) {
    currentApiKeys = readStoredApiKeys()
    currentDefaultModel = readStoredModel()
    currentCustomModels = readStoredCustomModels()
    hasInitializedStores = true
  }

  if (!hasAttachedStorageListener) {
    window.addEventListener('storage', handleStorageChange)
    hasAttachedStorageListener = true
  }
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === API_KEYS_STORAGE_KEY) {
    const parsed = parseApiKeys(event.newValue)
    if (!areApiKeysEqual(currentApiKeys, parsed)) {
      currentApiKeys = parsed
      emitApiKeysChange()
    }
  }

  if (event.key === MODEL_STORAGE_KEY) {
    const nextModel = event.newValue ?? EMPTY_MODEL
    if (nextModel !== currentDefaultModel) {
      currentDefaultModel = nextModel
      emitModelChange()
    }
  }

  if (event.key === CUSTOM_MODELS_STORAGE_KEY) {
    const parsed = parseCustomModels(event.newValue)
    if (!areCustomModelsEqual(currentCustomModels, parsed)) {
      currentCustomModels = parsed
      emitCustomModelsChange()
    }
  }
}

function readStoredApiKeys(): ApiKey[] {
  if (typeof window === 'undefined') return EMPTY_API_KEYS
  const stored = localStorage.getItem(API_KEYS_STORAGE_KEY)
  return parseApiKeys(stored)
}

function readStoredModel(): string {
  if (typeof window === 'undefined') return EMPTY_MODEL
  return localStorage.getItem(MODEL_STORAGE_KEY) ?? EMPTY_MODEL
}

function parseApiKeys(raw: string | null): ApiKey[] {
  if (!raw) return EMPTY_API_KEYS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY_API_KEYS
    return parsed.filter(isValidApiKey).map(cloneApiKey)
  } catch {
    return EMPTY_API_KEYS
  }
}

function isValidApiKey(value: unknown): value is ApiKey {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.service === 'string' &&
    typeof candidate.key === 'string' &&
    typeof candidate.addedAt === 'string'
  )
}

function cloneApiKey(value: ApiKey): ApiKey {
  return {
    service: value.service,
    key: value.key,
    addedAt: value.addedAt,
  }
}

function areApiKeysEqual(a: ApiKey[], b: ApiKey[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i]
    const bi = b[i]
    if (
      ai.service !== bi.service ||
      ai.key !== bi.key ||
      ai.addedAt !== bi.addedAt
    ) {
      return false
    }
  }
  return true
}

function normalizeApiKeys(value: ApiKey[]): ApiKey[] {
  return value.map(cloneApiKey)
}

// Custom models helper functions
function readStoredCustomModels(): CustomModel[] {
  if (typeof window === 'undefined') return EMPTY_CUSTOM_MODELS
  const stored = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY)
  return parseCustomModels(stored)
}

function parseCustomModels(raw: string | null): CustomModel[] {
  if (!raw) return EMPTY_CUSTOM_MODELS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY_CUSTOM_MODELS
    return parsed.filter(isValidCustomModel).map(cloneCustomModel)
  } catch {
    return EMPTY_CUSTOM_MODELS
  }
}

function isValidCustomModel(value: unknown): value is CustomModel {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.addedAt === 'string'
  )
}

function cloneCustomModel(value: CustomModel): CustomModel {
  return {
    id: value.id,
    name: value.name,
    addedAt: value.addedAt,
  }
}

function areCustomModelsEqual(a: CustomModel[], b: CustomModel[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i]
    const bi = b[i]
    if (
      ai.id !== bi.id ||
      ai.name !== bi.name ||
      ai.addedAt !== bi.addedAt
    ) {
      return false
    }
  }
  return true
}

function normalizeCustomModels(value: CustomModel[]): CustomModel[] {
  return value.map(cloneCustomModel)
}

// Subscribe functions for useSyncExternalStore
function subscribeApiKeys(listener: () => void) {
  ensureClientStoresInitialized()
  apiKeysListeners.add(listener)
  return () => {
    apiKeysListeners.delete(listener)
  }
}

function subscribeModel(listener: () => void) {
  ensureClientStoresInitialized()
  modelListeners.add(listener)
  return () => {
    modelListeners.delete(listener)
  }
}

function subscribeCustomModels(listener: () => void) {
  ensureClientStoresInitialized()
  customModelsListeners.add(listener)
  return () => {
    customModelsListeners.delete(listener)
  }
}

// Snapshot functions - return stable references
function getApiKeysSnapshot(): ApiKey[] {
  if (typeof window === 'undefined') return EMPTY_API_KEYS
  ensureClientStoresInitialized()
  return currentApiKeys
}

function getModelSnapshot(): string {
  if (typeof window === 'undefined') return EMPTY_MODEL
  ensureClientStoresInitialized()
  return currentDefaultModel
}

function getCustomModelsSnapshot(): CustomModel[] {
  if (typeof window === 'undefined') return EMPTY_CUSTOM_MODELS
  ensureClientStoresInitialized()
  return currentCustomModels
}

function getServerApiKeysSnapshot(): ApiKey[] {
  return EMPTY_API_KEYS
}

function getServerModelSnapshot(): string {
  return EMPTY_MODEL
}

function getServerCustomModelsSnapshot(): CustomModel[] {
  return EMPTY_CUSTOM_MODELS
}

/**
 * Hook to manage API keys with real-time sync across components.
 * Uses useSyncExternalStore to ensure all consumers update instantly
 * when localStorage changes.
 */
export function useApiKeys() {
  const apiKeys = useSyncExternalStore(
    subscribeApiKeys,
    getApiKeysSnapshot,
    getServerApiKeysSnapshot
  )

  const setApiKeys = useCallback(
    (updater: ApiKey[] | ((prev: ApiKey[]) => ApiKey[])) => {
      ensureClientStoresInitialized()

      const current = currentApiKeys
      const nextValue =
        typeof updater === 'function' ? updater(current) : updater
      const normalized = Array.isArray(nextValue)
        ? normalizeApiKeys(nextValue)
        : EMPTY_API_KEYS

      if (areApiKeysEqual(current, normalized)) {
        return
      }

      currentApiKeys = normalized

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          API_KEYS_STORAGE_KEY,
          JSON.stringify(currentApiKeys)
        )
      }

      emitApiKeysChange()
    },
    []
  )

  return { apiKeys, setApiKeys }
}

/**
 * Hook to manage the default AI model selection with real-time sync.
 * Uses useSyncExternalStore to ensure all consumers update instantly
 * when localStorage changes.
 */
export function useDefaultModel() {
  const defaultModel = useSyncExternalStore(
    subscribeModel,
    getModelSnapshot,
    getServerModelSnapshot
  )

  const setDefaultModel = useCallback((model: string) => {
    ensureClientStoresInitialized()

    const nextModel = model ?? EMPTY_MODEL
    if (nextModel === currentDefaultModel) {
      return
    }

    currentDefaultModel = nextModel

    if (typeof window !== 'undefined') {
      localStorage.setItem(MODEL_STORAGE_KEY, currentDefaultModel)
    }

    emitModelChange()
  }, [])

  return { defaultModel, setDefaultModel }
}

/**
 * Hook to manage custom OpenRouter models with real-time sync.
 * Users can add any OpenRouter model ID and it will appear in the model selector.
 */
export function useCustomModels() {
  const customModels = useSyncExternalStore(
    subscribeCustomModels,
    getCustomModelsSnapshot,
    getServerCustomModelsSnapshot
  )

  const setCustomModels = useCallback(
    (updater: CustomModel[] | ((prev: CustomModel[]) => CustomModel[])) => {
      ensureClientStoresInitialized()

      const current = currentCustomModels
      const nextValue =
        typeof updater === 'function' ? updater(current) : updater
      const normalized = Array.isArray(nextValue)
        ? normalizeCustomModels(nextValue)
        : EMPTY_CUSTOM_MODELS

      if (areCustomModelsEqual(current, normalized)) {
        return
      }

      currentCustomModels = normalized

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          CUSTOM_MODELS_STORAGE_KEY,
          JSON.stringify(currentCustomModels)
        )
      }

      emitCustomModelsChange()
    },
    []
  )

  const addCustomModel = useCallback((id: string, name: string) => {
    const newModel: CustomModel = {
      id: id.trim(),
      name: name.trim() || id.trim(),
      addedAt: new Date().toISOString(),
    }

    setCustomModels(prev => {
      // Don't add duplicates
      if (prev.some(m => m.id === newModel.id)) {
        return prev
      }
      return [...prev, newModel]
    })

    return newModel
  }, [setCustomModels])

  const removeCustomModel = useCallback((id: string) => {
    setCustomModels(prev => prev.filter(m => m.id !== id))
  }, [setCustomModels])

  return { customModels, setCustomModels, addCustomModel, removeCustomModel }
}

// Re-export storage keys for consistency
export { API_KEYS_STORAGE_KEY, MODEL_STORAGE_KEY, CUSTOM_MODELS_STORAGE_KEY }

