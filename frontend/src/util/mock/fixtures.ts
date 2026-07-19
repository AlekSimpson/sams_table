// In-memory fixture store backing the mock backend. Seeded once per page load;
// mutated in place by mock_rest_client.ts / mock_websocket.ts.
import { JWTClaims, Role, User } from '../../types/app_types'
import { CampaignPermissionEntry, DNDCampaign, DNDCharacter, DNDClass, DNDRace } from '../../types/dnd_types'
import { GameMap, MapTile, Token, UploadedAsset } from '../../types/game_types'

export const DEMO_CAMPAIGN_ID = 'demo-campaign-0001'
export const DEMO_DM_USER_ID = 'demo-user-dm-0001'
export const DEMO_PLAYER_USER_ID = 'demo-user-player-0001'
export const DEMO_MAP_ID = 'demo-map-0001'

const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z'

const DEMO_CAMPAIGN: DNDCampaign = {
  id: DEMO_CAMPAIGN_ID,
  name: 'The Sunken Spire',
  description: 'A cursed lighthouse rises from the tide, and something ancient stirs beneath it.',
  dm_id: DEMO_DM_USER_ID,
  created_at: DEMO_CREATED_AT,
}

const DEMO_CHARACTERS: DNDCharacter[] = [
  {
    id: 'demo-character-0001',
    campaign_id: DEMO_CAMPAIGN_ID,
    player_id: DEMO_PLAYER_USER_ID,
    name: 'Thorian Ashvale',
    class: 'Fighter',
    race: 'Human',
    level: 5,
    max_hp: 44,
    current_hp: 44,
    armor_class: 17,
    speed: 30,
    stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    skill_profs: ['athletics', 'intimidation', 'perception'],
    conditions: [],
    equipment: ['Longsword', 'Shield', 'Chain Mail', 'Explorer\'s Pack', 'Handaxe (2)'],
    notes: 'Owes a debt to the Ashvale family. Distrustful of magic.',
    created_at: DEMO_CREATED_AT,
  },
  {
    id: 'demo-character-0002',
    campaign_id: DEMO_CAMPAIGN_ID,
    name: 'Lyria Moonwhisper',
    class: 'Wizard',
    race: 'Elf',
    level: 4,
    max_hp: 22,
    current_hp: 22,
    armor_class: 12,
    speed: 30,
    stats: { str: 8, dex: 16, con: 12, int: 17, wis: 13, cha: 10 },
    skill_profs: ['arcana', 'investigation', 'history'],
    conditions: [],
    equipment: ['Quarterstaff', 'Component Pouch', 'Spellbook', 'Scholar\'s Pack'],
    notes: 'Seeking a lost tome rumored to be hidden beneath the Sunken Spire.',
    created_at: DEMO_CREATED_AT,
  },
  {
    id: 'demo-character-0003',
    campaign_id: DEMO_CAMPAIGN_ID,
    name: 'Grimble Stonefist',
    class: 'Cleric',
    race: 'Dwarf',
    level: 3,
    max_hp: 27,
    current_hp: 20,
    armor_class: 16,
    speed: 25,
    stats: { str: 14, dex: 10, con: 15, int: 9, wis: 16, cha: 11 },
    skill_profs: ['medicine', 'religion', 'insight'],
    conditions: ['poisoned'],
    equipment: ['Warhammer', 'Shield', 'Scale Mail', 'Holy Symbol', 'Priest\'s Pack'],
    notes: '',
    created_at: DEMO_CREATED_AT,
  },
]

const DEMO_MAP: GameMap = {
  id: DEMO_MAP_ID,
  campaign_id: DEMO_CAMPAIGN_ID,
  name: 'The Sunken Spire — Ground Floor',
  grid_width: 20,
  grid_height: 20,
  created_at: DEMO_CREATED_AT,
}

const DEMO_MAP_TILES: MapTile[] = [
  { id: 'demo-tile-0001', map_id: DEMO_MAP_ID, asset_id: 'default_floor_stone', asset_source: 'default', grid_x: 0, grid_y: 0, grid_z: 0, rotation_y: 0 },
  { id: 'demo-tile-0002', map_id: DEMO_MAP_ID, asset_id: 'default_floor_stone', asset_source: 'default', grid_x: 1, grid_y: 0, grid_z: 0, rotation_y: 0 },
  { id: 'demo-tile-0003', map_id: DEMO_MAP_ID, asset_id: 'default_floor_stone', asset_source: 'default', grid_x: 0, grid_y: 1, grid_z: 0, rotation_y: 0 },
  { id: 'demo-tile-0004', map_id: DEMO_MAP_ID, asset_id: 'default_floor_stone', asset_source: 'default', grid_x: 1, grid_y: 1, grid_z: 0, rotation_y: 0 },
  { id: 'demo-tile-0005', map_id: DEMO_MAP_ID, asset_id: 'default_wall_brick', asset_source: 'default', grid_x: 0, grid_y: -1, grid_z: 0, rotation_y: 0 },
  { id: 'demo-tile-0006', map_id: DEMO_MAP_ID, asset_id: 'default_wall_brick', asset_source: 'default', grid_x: 1, grid_y: -1, grid_z: 0, rotation_y: 90 },
]

// Token is not map-scoped (see types/game_types.ts) — the demo campaign only has one
// map, so these are simply seeded once per character rather than filtered by map_id.
const DEMO_TOKENS: Token[] = [
  { id: 'demo-token-0001', character_id: 'demo-character-0001', grid_x: 0, grid_y: 0 },
  { id: 'demo-token-0002', character_id: 'demo-character-0002', grid_x: 1, grid_y: 0 },
  { id: 'demo-token-0003', character_id: 'demo-character-0003', grid_x: 0, grid_y: 1 },
]

const DEMO_UPLOADED_ASSETS: UploadedAsset[] = [
  {
    id: 'demo-asset-0001',
    campaign_id: DEMO_CAMPAIGN_ID,
    uploaded_by: DEMO_DM_USER_ID,
    label: 'Stone Watchtower',
    storage_path: '/uploads/stone_watchtower.stl',
    grid_width: 2,
    grid_depth: 2,
    scale_factor: 1,
    asset_type: 'map_tile',
    created_at: DEMO_CREATED_AT,
  },
  {
    id: 'demo-asset-0002',
    campaign_id: DEMO_CAMPAIGN_ID,
    uploaded_by: DEMO_DM_USER_ID,
    label: 'Goblin Skirmisher',
    storage_path: '/uploads/goblin_skirmisher.stl',
    grid_width: 1,
    grid_depth: 1,
    scale_factor: 1,
    asset_type: 'mini',
    created_at: DEMO_CREATED_AT,
  },
]

const DEMO_CLASSES: DNDClass[] = [
  { key: 'fighter', name: 'Fighter', hit_die: 10, saving_throws: ['str', 'con'], primary_ability: ['str', 'dex'], armor_proficiencies: ['light', 'medium', 'heavy', 'shields'], weapon_proficiencies: ['simple', 'martial'], num_skill_proficiencies: 2 },
  { key: 'wizard', name: 'Wizard', hit_die: 6, saving_throws: ['int', 'wis'], primary_ability: ['int'], spellcasting_ability: 'int', armor_proficiencies: [], weapon_proficiencies: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'], num_skill_proficiencies: 2 },
  { key: 'cleric', name: 'Cleric', hit_die: 8, saving_throws: ['wis', 'cha'], primary_ability: ['wis'], spellcasting_ability: 'wis', armor_proficiencies: ['light', 'medium', 'shields'], weapon_proficiencies: ['simple'], num_skill_proficiencies: 2 },
  { key: 'rogue', name: 'Rogue', hit_die: 8, saving_throws: ['dex', 'int'], primary_ability: ['dex'], armor_proficiencies: ['light'], weapon_proficiencies: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'], num_skill_proficiencies: 4 },
  { key: 'ranger', name: 'Ranger', hit_die: 10, saving_throws: ['str', 'dex'], primary_ability: ['dex', 'wis'], spellcasting_ability: 'wis', armor_proficiencies: ['light', 'medium', 'shields'], weapon_proficiencies: ['simple', 'martial'], num_skill_proficiencies: 3 },
]

const DEMO_RACES: DNDRace[] = [
  { key: 'human', name: 'Human', stat_bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, size: 'Medium', base_speed: 30, traits: ['Extra Language'] },
  {
    key: 'elf', name: 'Elf', stat_bonuses: { dex: 2 }, size: 'Medium', base_speed: 30, traits: ['Darkvision', 'Fey Ancestry', 'Trance'],
    subraces: [
      { key: 'high_elf', race_key: 'elf', name: 'High Elf', stat_bonuses: { int: 1 }, traits: ['Cantrip', 'Extra Language'] },
      { key: 'wood_elf', race_key: 'elf', name: 'Wood Elf', stat_bonuses: { wis: 1 }, traits: ['Fleet of Foot', 'Mask of the Wild'] },
    ],
  },
  {
    key: 'dwarf', name: 'Dwarf', stat_bonuses: { con: 2 }, size: 'Medium', base_speed: 25, traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'],
    subraces: [
      { key: 'hill_dwarf', race_key: 'dwarf', name: 'Hill Dwarf', stat_bonuses: { wis: 1 }, traits: ['Dwarven Toughness'] },
    ],
  },
  { key: 'halfling', name: 'Halfling', stat_bonuses: { dex: 2 }, size: 'Small', base_speed: 25, traits: ['Lucky', 'Brave', 'Halfling Nimbleness'] },
]

const DEMO_PERMISSIONS: Record<string, CampaignPermissionEntry[]> = {
  [DEMO_CAMPAIGN_ID]: [
    { user_id: DEMO_DM_USER_ID, can_move_tokens: true, can_place_tiles: true },
    { user_id: DEMO_PLAYER_USER_ID, can_move_tokens: true, can_place_tiles: false },
  ],
}

/** Mutable in-memory fixture store. Everything the mock api groups read/write lives here. */
export const mock_store = {
  campaigns: [DEMO_CAMPAIGN] as DNDCampaign[],
  characters: DEMO_CHARACTERS.slice(),
  maps: [DEMO_MAP] as GameMap[],
  map_tiles: DEMO_MAP_TILES.slice(),
  tokens: DEMO_TOKENS.slice(),
  uploaded_assets: DEMO_UPLOADED_ASSETS.slice(),
  classes: DEMO_CLASSES,
  races: DEMO_RACES,
  permissions: { ...DEMO_PERMISSIONS } as Record<string, CampaignPermissionEntry[]>,
  join_codes: {} as Record<string, { campaign_id: string; active_map_id: string | null }>,
}

interface MockUserRecord {
  user: User
  role: Role
}

const users_by_username = new Map<string, MockUserRecord>([
  ['dm_demo', { user: { id: DEMO_DM_USER_ID, username: 'dm_demo', created_at: DEMO_CREATED_AT }, role: 'dm' }],
  ['player_demo', { user: { id: DEMO_PLAYER_USER_ID, username: 'player_demo', created_at: DEMO_CREATED_AT }, role: 'player' }],
])

/** Looks up a user by username, auto-creating a `player` account on first login/register. */
export function get_or_create_user(username: string): MockUserRecord {
  const existing = users_by_username.get(username)
  if (existing) return existing

  const created: MockUserRecord = {
    user: { id: crypto.randomUUID(), username, created_at: new Date().toISOString() },
    role: 'player',
  }
  users_by_username.set(username, created)
  return created
}

function base64_encode_json(value: unknown): string {
  return btoa(JSON.stringify(value))
}

/** Builds a fake-but-well-formed JWT (header.payload.signature) matching JWTClaims. */
export function encode_mock_jwt(claims: JWTClaims): string {
  const header = { alg: 'mock', typ: 'JWT' }
  return `${base64_encode_json(header)}.${base64_encode_json(claims)}.mock-signature`
}

const JOIN_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Generates a short human-typeable join code for session_api.start(). */
export function generate_join_code(): string {
  let code = ''
  for (let character_index = 0; character_index < 6; character_index++) {
    code += JOIN_CODE_CHARACTERS[Math.floor(Math.random() * JOIN_CODE_CHARACTERS.length)]
  }
  return code
}

// mock_store itself only lives in this page's JS memory, so it can't be seen by a DM
// and a player driving the app from two different browser tabs/pages (e.g. an E2E test
// with a separate DM page and player page in the same browser context). Join codes are
// the one piece of state that genuinely needs to cross that boundary, so they're mirrored
// into localStorage (shared per-origin across tabs of the same context) in addition to
// mock_store.join_codes, and session join checks both.
const SHARED_JOIN_CODES_STORAGE_KEY = 'sams-table-mock-join-codes'

export function read_shared_join_codes(): Record<string, { campaign_id: string; active_map_id: string | null }> {
  try {
    const raw = localStorage.getItem(SHARED_JOIN_CODES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function write_shared_join_codes(join_codes: Record<string, { campaign_id: string; active_map_id: string | null }>): void {
  try {
    localStorage.setItem(SHARED_JOIN_CODES_STORAGE_KEY, JSON.stringify(join_codes))
  } catch {
    // ignore storage errors (e.g. unavailable/full storage)
  }
}
