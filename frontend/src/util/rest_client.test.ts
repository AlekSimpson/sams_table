import { afterEach, describe, expect, it, vi } from 'vitest'
import { asset_api, auth_api, campaign_api, character_api, map_api, permission_api, session_api } from './rest_client'
import { DEMO_CAMPAIGN_ID, DEMO_DM_USER_ID, DEMO_MAP_ID } from './mock/fixtures'

function mock_fetch_ok(json_body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => json_body })
}

function mock_fetch_failure(status: number, error_text: string) {
  return vi.fn().mockResolvedValue({ ok: false, status, text: async () => error_text })
}

/** Re-imports rest_client (and its mock backend) fresh, with VITE_USE_MOCK_BACKEND
 *  pinned to the given mode. Needed because MOCK_MODE_ENABLED is read once at module
 *  load time — the default top-level import of rest_client above always reflects
 *  mock mode ON (the test environment leaves VITE_USE_MOCK_BACKEND unset). */
async function import_rest_client(mock_mode_enabled: boolean) {
  vi.resetModules()
  if (mock_mode_enabled) {
    vi.unstubAllEnvs()
  } else {
    vi.stubEnv('VITE_USE_MOCK_BACKEND', 'false')
  }
  const rest_client_module = await import('./rest_client')
  const mock_rest_client_module = await import('./mock/mock_rest_client')
  return { rest_client: rest_client_module, mock_rest_client: mock_rest_client_module }
}

describe('rest_client', () => {
  const original_fetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = original_fetch
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('mock-mode dispatch routing', () => {
    it('routes to the mock implementation and never calls fetch when mock mode is enabled (default)', async () => {
      const fetch_spy = vi.fn()
      globalThis.fetch = fetch_spy as unknown as typeof fetch
      const { rest_client, mock_rest_client } = await import_rest_client(true)
      const login_spy = vi.spyOn(mock_rest_client.mock_auth_api, 'login')

      await rest_client.auth_api.login('dm_demo', 'any-password')

      expect(login_spy).toHaveBeenCalledWith('dm_demo', 'any-password')
      expect(fetch_spy).not.toHaveBeenCalled()
    })

    it('routes to real fetch and never calls the mock implementation when mock mode is explicitly disabled', async () => {
      const fetch_spy = mock_fetch_ok({
        token: 'real-token',
        user: { id: 'real-user', username: 'dm_demo', created_at: '2026-01-01T00:00:00Z' },
      })
      globalThis.fetch = fetch_spy as unknown as typeof fetch
      const { rest_client, mock_rest_client } = await import_rest_client(false)
      const login_spy = vi.spyOn(mock_rest_client.mock_auth_api, 'login')

      const result = await rest_client.auth_api.login('dm_demo', 'any-password')

      expect(fetch_spy).toHaveBeenCalled()
      expect(login_spy).not.toHaveBeenCalled()
      expect(result.token).toBe('real-token')
    })
  })

  describe('auth_api', () => {
    it('login resolves with the matching demo user and a token on success', async () => {
      const result = await auth_api.login('dm_demo', 'any-password')

      expect(result.user.id).toBe(DEMO_DM_USER_ID)
      expect(result.user.username).toBe('dm_demo')
      expect(typeof result.token).toBe('string')
      expect(result.token.length).toBeGreaterThan(0)
    })

    it('login rejects when the real backend request fails', async () => {
      globalThis.fetch = mock_fetch_failure(401, 'Invalid credentials') as unknown as typeof fetch
      const { rest_client } = await import_rest_client(false)

      await expect(rest_client.auth_api.login('dm_demo', 'wrong-password')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('campaign_api', () => {
    it('list resolves with the seeded demo campaign on success', async () => {
      const result = await campaign_api.list()

      expect(result.some((campaign) => campaign.id === DEMO_CAMPAIGN_ID)).toBe(true)
    })

    it('get rejects with an error when the campaign does not exist', async () => {
      await expect(campaign_api.get('missing-campaign-id')).rejects.toThrow('Campaign not found: missing-campaign-id')
    })
  })

  describe('character_api', () => {
    it('list_characters_in_campaign resolves with the seeded demo characters on success', async () => {
      const result = await character_api.list_characters_in_campaign(DEMO_CAMPAIGN_ID)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((character) => character.campaign_id === DEMO_CAMPAIGN_ID)).toBe(true)
    })

    it('get rejects with an error when the character does not exist', async () => {
      await expect(character_api.get('missing-character-id')).rejects.toThrow(
        'Character not found: missing-character-id'
      )
    })
  })

  describe('map_api', () => {
    it('list resolves with the seeded demo map on success', async () => {
      const result = await map_api.list()

      expect(result.some((map) => map.id === DEMO_MAP_ID)).toBe(true)
    })

    it('get rejects with an error when the map does not exist', async () => {
      await expect(map_api.get('missing-map-id')).rejects.toThrow('Map not found: missing-map-id')
    })
  })

  describe('asset_api', () => {
    it('upload resolves with the created asset on success', async () => {
      const form_data = new FormData()
      form_data.append('label', 'Test Tile')
      form_data.append('asset_type', 'map_tile')

      const result = await asset_api.upload(form_data)

      expect(result.label).toBe('Test Tile')
      expect(result.asset_type).toBe('map_tile')
    })

    it('upload rejects when the real backend request fails', async () => {
      globalThis.fetch = mock_fetch_failure(500, 'Upload failed') as unknown as typeof fetch
      const { rest_client } = await import_rest_client(false)

      await expect(rest_client.asset_api.upload(new FormData())).rejects.toThrow('Upload failed')
    })
  })

  describe('permission_api', () => {
    it('get resolves with the seeded permission entries on success', async () => {
      const result = await permission_api.get(DEMO_CAMPAIGN_ID)

      expect(result.length).toBeGreaterThan(0)
    })

    it('set rejects when the real backend request fails', async () => {
      globalThis.fetch = mock_fetch_failure(403, 'Forbidden') as unknown as typeof fetch
      const { rest_client } = await import_rest_client(false)

      await expect(
        rest_client.permission_api.set(DEMO_CAMPAIGN_ID, DEMO_DM_USER_ID, {
          can_move_tokens: true,
          can_place_tiles: true,
        })
      ).rejects.toThrow('Forbidden')
    })
  })

  describe('session_api', () => {
    it('start resolves with a join code on success', async () => {
      const result = await session_api.start(DEMO_CAMPAIGN_ID)

      expect(typeof result.join_code).toBe('string')
      expect(result.join_code.length).toBe(6)
    })

    it('join rejects with an error for an invalid code', async () => {
      await expect(session_api.join('BADCODE')).rejects.toThrow('Invalid join code: BADCODE')
    })
  })
})
