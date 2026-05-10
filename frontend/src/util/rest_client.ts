// MODEL layer — typed REST wrappers. Used by viewmodels, not Views directly.
import { session_model } from '../models/session_model'
import { AuthResponse } from '../types/app_types'
import { GameMap, MapTile, UploadedAsset } from '../types/game_types'
import { DNDCampaign, DNDCharacter, DNDClass, DNDRace } from '../types/dnd_types'

const BASE_URL = '/api'

function auth_header(): Record<string, string> {
  const token = session_model.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...auth_header(),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const auth_api = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
}

export const campaign_api = {
  list: () => request<DNDCampaign[]>('/campaigns'),

  create: (name: string, description?: string) =>
    request<DNDCampaign>('/campaigns', { method: 'POST', body: JSON.stringify({ name, description }) }),

  get: (id: string) => request<DNDCampaign>(`/campaigns/${id}`),
}

export const character_api = {
  list_characters_in_campaign: (campaign_id: string) => request<DNDCharacter[]>(`/campaigns/${campaign_id}/characters`),

  list_user_characters: (user_id: string) => request<DNDCharacter[]>(`/users/${user_id}/characters`),

  create: (user_id: string, data: { name: string; class?: string; race?: string }) =>
    request<DNDCharacter>(`/users/${user_id}/create_character`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) => request<DNDCharacter>(`/characters/${id}`),

  update: (id: string, data: Partial<DNDCharacter>) =>
    request<DNDCharacter>(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => request<void>(`/characters/${id}`, { method: 'DELETE' })
}

export const rules_api = {
  get_classes: () => request<DNDClass[]>('/rules/classes'),
  get_races:   () => request<DNDRace[]>('/rules/races'),
}

export const map_api = {
  list: () => request<GameMap[]>('/maps'),

  create: (campaign_id: string, name: string) =>
    request<GameMap>('/maps', { method: 'POST', body: JSON.stringify({ campaign_id: campaign_id, name }) }),

  get: (id: string) => request<GameMap>(`/maps/${id}`),

  getTiles: (map_id: string) => request<MapTile[]>(`/maps/${map_id}/tiles`),

  putTiles: (map_id: string, tiles: MapTile[]) =>
    request<void>(`/maps/${map_id}/tiles`, { method: 'PUT', body: JSON.stringify(tiles) }),
}

export const asset_api = {
  upload: async (form_data: FormData): Promise<UploadedAsset> => {
    // Multipart upload — do not set Content-Type; browser sets it with boundary
    const res = await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      body: form_data,
      headers: { ...auth_header() },
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<UploadedAsset>
  },

  getUrl: (assetID: string) => `${BASE_URL}/assets/${assetID}`,
}
