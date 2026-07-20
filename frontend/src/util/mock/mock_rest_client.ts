// Mock implementations of every rest_client.ts api group. Resolves against the
// in-memory fixture store instead of `fetch`, with simulated network latency.
import { session_model } from '../../models/session_model'
import { AuthResponse, JWTClaims, SessionJoinResponse, SessionStartResponse } from '../../types/app_types'
import { CampaignPermissionEntry, DNDCampaign, DNDCharacter, DNDClass, DNDRace } from '../../types/dnd_types'
import { GameMap, MapTile, Token, UploadedAsset } from '../../types/game_types'
import { resolve_after_latency } from './mock_config'
import {
  DEMO_CAMPAIGN_ID,
  DEMO_DM_USER_ID,
  encode_mock_jwt,
  generate_join_code,
  get_or_create_user,
  mock_store,
  read_shared_join_codes,
  write_shared_join_codes,
} from './fixtures'

function current_user_id(): string {
  return session_model.getState().user?.id ?? DEMO_DM_USER_ID
}

function build_auth_response(username: string): AuthResponse {
  const { user, role } = get_or_create_user(username)
  const issued_at = Math.floor(Date.now() / 1000)
  const claims: JWTClaims = {
    user_id: user.id,
    campaign_id: DEMO_CAMPAIGN_ID,
    role,
    expiration_time: issued_at + 24 * 60 * 60,
    issued_at,
  }
  return { token: encode_mock_jwt(claims), user }
}

export const mock_auth_api = {
  register: (username: string, _password: string) => resolve_after_latency(() => build_auth_response(username)),
  login: (username: string, _password: string) => resolve_after_latency(() => build_auth_response(username)),
}

export const mock_campaign_api = {
  list: () => resolve_after_latency(() => mock_store.campaigns.slice()),

  create: (name: string, description?: string) =>
    resolve_after_latency((): DNDCampaign => {
      const campaign: DNDCampaign = {
        id: crypto.randomUUID(),
        name,
        description: description ?? '',
        dm_id: current_user_id(),
        created_at: new Date().toISOString(),
      }
      mock_store.campaigns.push(campaign)
      return campaign
    }),

  get: (id: string) =>
    resolve_after_latency((): DNDCampaign => {
      const campaign = mock_store.campaigns.find((candidate) => candidate.id === id)
      if (!campaign) throw new Error(`Campaign not found: ${id}`)
      return campaign
    }),

  list_maps: (campaign_id: string) =>
    resolve_after_latency(() => mock_store.maps.filter((map) => map.campaign_id === campaign_id)),

  list_assets: (campaign_id: string) =>
    resolve_after_latency(() => mock_store.uploaded_assets.filter((asset) => asset.campaign_id === campaign_id)),
}

export const mock_character_api = {
  list_characters_in_campaign: (campaign_id: string) =>
    resolve_after_latency(() => mock_store.characters.filter((character) => character.campaign_id === campaign_id)),

  list_user_characters: (user_id: string) =>
    resolve_after_latency(() => mock_store.characters.filter((character) => character.player_id === user_id)),

  create: (user_id: string, data: { name: string; class?: string; race?: string }) =>
    resolve_after_latency((): DNDCharacter => {
      const character: DNDCharacter = {
        id: crypto.randomUUID(),
        campaign_id: DEMO_CAMPAIGN_ID,
        player_id: user_id,
        name: data.name,
        class: data.class ?? '',
        race: data.race ?? '',
        level: 1,
        max_hp: 10,
        current_hp: 10,
        armor_class: 10,
        speed: 30,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        skill_profs: [],
        conditions: [],
        equipment: [],
        notes: '',
        weapon_proficiencies: '',
        armor_proficiencies: '',
        tool_proficiencies: '',
        languages: '',
        created_at: new Date().toISOString(),
      }
      mock_store.characters.push(character)
      return character
    }),

  get: (id: string) =>
    resolve_after_latency((): DNDCharacter => {
      const character = mock_store.characters.find((candidate) => candidate.id === id)
      if (!character) throw new Error(`Character not found: ${id}`)
      return character
    }),

  update: (id: string, data: Partial<DNDCharacter>) =>
    resolve_after_latency((): DNDCharacter => {
      const index = mock_store.characters.findIndex((candidate) => candidate.id === id)
      if (index === -1) throw new Error(`Character not found: ${id}`)
      const updated = { ...mock_store.characters[index], ...data }
      mock_store.characters[index] = updated
      return updated
    }),

  delete: (id: string) =>
    resolve_after_latency(() => {
      mock_store.characters = mock_store.characters.filter((candidate) => candidate.id !== id)
    }),
}

export const mock_rules_api = {
  get_classes: () => resolve_after_latency((): DNDClass[] => mock_store.classes.slice()),
  get_races: () => resolve_after_latency((): DNDRace[] => mock_store.races.slice()),
}

export const mock_map_api = {
  create: (campaign_id: string, name: string, grid_width: number, grid_height: number) =>
    resolve_after_latency((): GameMap => {
      const map: GameMap = {
        id: crypto.randomUUID(),
        campaign_id,
        name,
        grid_width,
        grid_height,
        created_at: new Date().toISOString(),
      }
      mock_store.maps.push(map)
      return map
    }),

  get: (id: string) =>
    resolve_after_latency((): GameMap => {
      const map = mock_store.maps.find((candidate) => candidate.id === id)
      if (!map) throw new Error(`Map not found: ${id}`)
      return map
    }),

  getTiles: (map_id: string) =>
    resolve_after_latency(() => mock_store.map_tiles.filter((tile) => tile.map_id === map_id)),

  putTiles: (map_id: string, tiles: MapTile[]) =>
    resolve_after_latency(() => {
      mock_store.map_tiles = [...mock_store.map_tiles.filter((tile) => tile.map_id !== map_id), ...tiles]
    }),

  // Token isn't map-scoped (see types/game_types.ts) — the demo fixtures only ever
  // populate one map's worth of tokens, so map_id is accepted for API symmetry with
  // getTiles but not used to filter here.
  getTokens: (_map_id: string) => resolve_after_latency((): Token[] => mock_store.tokens.slice()),
}

export const mock_asset_api = {
  upload: (form_data: FormData) =>
    resolve_after_latency((): UploadedAsset => {
      const uploaded_file = form_data.get('file') as File | null
      const asset: UploadedAsset = {
        id: crypto.randomUUID(),
        campaign_id: (form_data.get('campaign_id') as string) || undefined,
        uploaded_by: current_user_id(),
        label: (form_data.get('label') as string) || uploaded_file?.name || 'Untitled asset',
        storage_path: `/uploads/${uploaded_file?.name ?? 'asset.stl'}`,
        grid_width: Number(form_data.get('grid_width') ?? 1),
        grid_depth: Number(form_data.get('grid_depth') ?? 1),
        scale_factor: Number(form_data.get('scale_factor') ?? 1),
        asset_type: (form_data.get('asset_type') as 'map_tile' | 'mini') || 'map_tile',
        created_at: new Date().toISOString(),
      }
      mock_store.uploaded_assets.push(asset)
      return asset
    }),
}

export const mock_permission_api = {
  get: (campaign_id: string) =>
    resolve_after_latency((): CampaignPermissionEntry[] => mock_store.permissions[campaign_id]?.slice() ?? []),

  set: (campaign_id: string, user_id: string, permissions: Omit<CampaignPermissionEntry, 'user_id'>) =>
    resolve_after_latency((): CampaignPermissionEntry => {
      const entry: CampaignPermissionEntry = { user_id, ...permissions }
      const existing_entries = mock_store.permissions[campaign_id] ?? []
      const other_entries = existing_entries.filter((candidate) => candidate.user_id !== user_id)
      mock_store.permissions[campaign_id] = [...other_entries, entry]
      return entry
    }),
}

export const mock_session_api = {
  start: (campaign_id: string) =>
    resolve_after_latency((): SessionStartResponse => {
      const join_code = generate_join_code()
      const active_map = mock_store.maps.find((map) => map.campaign_id === campaign_id)
      const session_entry = { campaign_id, active_map_id: active_map?.id ?? null }
      mock_store.join_codes[join_code] = session_entry
      write_shared_join_codes({ ...read_shared_join_codes(), [join_code]: session_entry })
      return { join_code }
    }),

  join: (code: string) =>
    resolve_after_latency((): SessionJoinResponse => {
      const session = mock_store.join_codes[code] ?? read_shared_join_codes()[code]
      if (!session) throw new Error(`Invalid join code: ${code}`)
      return session
    }),

  end: (campaign_id: string) =>
    resolve_after_latency((): void => {
      // Invalidate every outstanding join code for this campaign so a stale code
      // can't be used to join a session that's already ended.
      for (const code of Object.keys(mock_store.join_codes)) {
        if (mock_store.join_codes[code].campaign_id === campaign_id) delete mock_store.join_codes[code]
      }
      const shared_join_codes = read_shared_join_codes()
      for (const code of Object.keys(shared_join_codes)) {
        if (shared_join_codes[code].campaign_id === campaign_id) delete shared_join_codes[code]
      }
      write_shared_join_codes(shared_join_codes)
    }),
}
