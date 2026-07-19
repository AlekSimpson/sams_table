// MODEL layer — typed REST wrappers. Used by viewmodels, not Views directly.
import { session_model } from '../models/session_model'
import { AuthResponse, SessionJoinResponse, SessionStartResponse } from '../types/app_types'
import { GameMap, MapTile, Token, UploadedAsset } from '../types/game_types'
import { CampaignPermissionEntry, DNDCampaign, DNDCharacter, DNDClass, DNDRace } from '../types/dnd_types'
import { MOCK_MODE_ENABLED } from './mock/mock_config'
import {
  mock_asset_api,
  mock_auth_api,
  mock_campaign_api,
  mock_character_api,
  mock_map_api,
  mock_permission_api,
  mock_rules_api,
  mock_session_api,
} from './mock/mock_rest_client'

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

/** Routes to the mock backend when MOCK_MODE_ENABLED, otherwise performs the real request. */
function resolve<T>(real_call: () => Promise<T>, mock_call: () => Promise<T>): Promise<T> {
  return MOCK_MODE_ENABLED ? mock_call() : real_call()
}

export const auth_api = {
  register: (username: string, password: string) =>
    resolve(
      () => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
      () => mock_auth_api.register(username, password)
    ),

  login: (username: string, password: string) =>
    resolve(
      () => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
      () => mock_auth_api.login(username, password)
    ),
}

export const campaign_api = {
  list: () => resolve(() => request<DNDCampaign[]>('/campaigns'), () => mock_campaign_api.list()),

  create: (name: string, description?: string) =>
    resolve(
      () => request<DNDCampaign>('/campaigns', { method: 'POST', body: JSON.stringify({ name, description }) }),
      () => mock_campaign_api.create(name, description)
    ),

  get: (id: string) => resolve(() => request<DNDCampaign>(`/campaigns/${id}`), () => mock_campaign_api.get(id)),

  list_maps: (campaign_id: string) =>
    resolve(
      () => request<GameMap[]>(`/campaigns/${campaign_id}/maps`),
      () => mock_campaign_api.list_maps(campaign_id)
    ),

  list_assets: (campaign_id: string) =>
    resolve(
      () => request<UploadedAsset[]>(`/campaigns/${campaign_id}/assets`),
      () => mock_campaign_api.list_assets(campaign_id)
    ),
}

export const character_api = {
  list_characters_in_campaign: (campaign_id: string) =>
    resolve(
      () => request<DNDCharacter[]>(`/campaigns/${campaign_id}/characters`),
      () => mock_character_api.list_characters_in_campaign(campaign_id)
    ),

  list_user_characters: (user_id: string) =>
    resolve(
      () => request<DNDCharacter[]>(`/users/${user_id}/characters`),
      () => mock_character_api.list_user_characters(user_id)
    ),

  create: (user_id: string, data: { name: string; class?: string; race?: string }) =>
    resolve(
      () => request<DNDCharacter>(`/users/${user_id}/create_character`, { method: 'POST', body: JSON.stringify(data) }),
      () => mock_character_api.create(user_id, data)
    ),

  get: (id: string) => resolve(() => request<DNDCharacter>(`/characters/${id}`), () => mock_character_api.get(id)),

  update: (id: string, data: Partial<DNDCharacter>) =>
    resolve(
      () => request<DNDCharacter>(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      () => mock_character_api.update(id, data)
    ),

  delete: (id: string) =>
    resolve(() => request<void>(`/characters/${id}`, { method: 'DELETE' }), () => mock_character_api.delete(id)),
}

export const rules_api = {
  get_classes: () => resolve(() => request<DNDClass[]>('/rules/classes'), () => mock_rules_api.get_classes()),
  get_races: () => resolve(() => request<DNDRace[]>('/rules/races'), () => mock_rules_api.get_races()),
}

export const map_api = {
  list: () => resolve(() => request<GameMap[]>('/maps'), () => mock_map_api.list()),

  create: (campaign_id: string, name: string) =>
    resolve(
      () => request<GameMap>('/maps', { method: 'POST', body: JSON.stringify({ campaign_id: campaign_id, name }) }),
      () => mock_map_api.create(campaign_id, name)
    ),

  get: (id: string) => resolve(() => request<GameMap>(`/maps/${id}`), () => mock_map_api.get(id)),

  getTiles: (map_id: string) =>
    resolve(() => request<MapTile[]>(`/maps/${map_id}/tiles`), () => mock_map_api.getTiles(map_id)),

  putTiles: (map_id: string, tiles: MapTile[]) =>
    resolve(
      () => request<void>(`/maps/${map_id}/tiles`, { method: 'PUT', body: JSON.stringify(tiles) }),
      () => mock_map_api.putTiles(map_id, tiles)
    ),

  getTokens: (map_id: string) =>
    resolve(() => request<Token[]>(`/maps/${map_id}/tokens`), () => mock_map_api.getTokens(map_id)),
}

export const asset_api = {
  upload: (form_data: FormData): Promise<UploadedAsset> =>
    resolve(
      async () => {
        // Multipart upload — do not set Content-Type; browser sets it with boundary
        const res = await fetch(`${BASE_URL}/assets`, {
          method: 'POST',
          body: form_data,
          headers: { ...auth_header() },
        })
        if (!res.ok) throw new Error(await res.text())
        return res.json() as Promise<UploadedAsset>
      },
      () => mock_asset_api.upload(form_data)
    ),

  getUrl: (assetID: string) => `${BASE_URL}/assets/${assetID}`,
}

export const permission_api = {
  get: (campaign_id: string) =>
    resolve(
      () => request<CampaignPermissionEntry[]>(`/campaigns/${campaign_id}/permissions`),
      () => mock_permission_api.get(campaign_id)
    ),

  set: (campaign_id: string, user_id: string, permissions: Omit<CampaignPermissionEntry, 'user_id'>) =>
    resolve(
      () =>
        request<CampaignPermissionEntry>(`/campaigns/${campaign_id}/permissions/${user_id}`, {
          method: 'PUT',
          body: JSON.stringify(permissions),
        }),
      () => mock_permission_api.set(campaign_id, user_id, permissions)
    ),
}

export const session_api = {
  start: (campaign_id: string) =>
    resolve(
      () => request<SessionStartResponse>(`/campaigns/${campaign_id}/sessions`, { method: 'POST' }),
      () => mock_session_api.start(campaign_id)
    ),

  join: (code: string) =>
    resolve(
      () => request<SessionJoinResponse>(`/sessions/join/${code}`, { method: 'POST' }),
      () => mock_session_api.join(code)
    ),
}
