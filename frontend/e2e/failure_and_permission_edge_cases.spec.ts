// Real-browser end-to-end tests for failure/rejection paths and permission boundaries —
// the counterpart to the two happy-path E2E specs (dm_primary_flow.spec.ts,
// player_primary_flow.spec.ts). Each test asserts both the presence of the expected
// error/redirect AND the absence of the corresponding unwanted success outcome (no
// session joined, no roll sent, no map created, no unauthorized page reached).
import { test, expect, Page } from '@playwright/test'

/** Logs in as the seeded player_demo user and opens their existing seeded character's
 *  dashboard (Thorian Ashvale) — reused by the join-code and dice-notation failure tests
 *  below, since both need a mounted PlayerDashboard. */
async function login_as_player_and_open_character_dashboard(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill('player_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/play')

  await expect(page.locator('.character-card')).toHaveCount(1)
  await page.locator('.character-card').first().click()
  await expect(page).toHaveURL(/\/play\/dashboard\//)
}

test('Invalid join code shows an inline error and does not start a session', async ({ page }) => {
  await login_as_player_and_open_character_dashboard(page)

  const bogus_code = 'ZZZZZZ'
  await page.getByPlaceholder('Join Code').fill(bogus_code)
  await page.getByRole('button', { name: 'Join' }).click()

  await expect(page.locator('.session-status-bar__join-error')).toBeVisible()
  await expect(page.locator('.session-status-bar__join-error')).toContainText(bogus_code)
  // join_code_model (session_viewmodel.ts) only clears the draft on a successful join —
  // it staying populated is direct proof the join never went through.
  await expect(page.getByPlaceholder('Join Code')).toHaveValue(bogus_code)

  // Absence of the unwanted outcome, verified at the state layer: active_map_id is only
  // ever written by set_campaign_session, which session_viewmodel.ts's join_code_model
  // only calls after session_api.join resolves successfully (login's JWT claims never
  // carry an active_map_id — see types/app_types.ts's JWTClaims — so it stays at its
  // initial null unless a join actually went through). session_model.ts persists this to
  // localStorage under 'sams-table-session', so reading it confirms no session was
  // established at the state layer, not just that the UI happens to look right. (Note:
  // campaign_id isn't useful here — every login's mock JWT claims already carry the demo
  // campaign_id regardless of role, so it's set before any join attempt and wouldn't
  // change on a successful one either, since this demo setup only has one campaign.)
  const persisted_active_map_id = await page.evaluate(() => {
    const raw = localStorage.getItem('sams-table-session')
    if (!raw) return undefined
    return JSON.parse(raw)?.state?.active_map_id
  })
  expect(persisted_active_map_id).toBeFalsy()
})

test('Invalid dice notation shows a validation error and does not send a roll request', async ({ page }) => {
  await login_as_player_and_open_character_dashboard(page)

  await page.getByRole('button', { name: 'Dice', exact: true }).click()
  // Same mock-WS connection-latency wait used in player_primary_flow.spec.ts — irrelevant
  // to whether validation fires, but kept so this test's timing matches the happy-path
  // dice test and stays deterministic if a later change makes the invalid case WS-dependent.
  await page.waitForTimeout(500)

  await page.getByLabel('Dice Notation').fill('abc')
  await page.getByRole('button', { name: 'Roll', exact: true }).click()

  await expect(page.locator('.dice-roller__error')).toBeVisible()
  await expect(page.locator('.dice-roller__error')).toHaveText('Enter valid dice notation, e.g. 2d6+3 or 1d20')

  // is_valid_dice_notation() (combat_viewmodel.ts) gates roll_dice()/send() entirely on an
  // early return — the button never flips to "Rolling…", which is direct proof no request
  // was ever dispatched over the (mock) WebSocket.
  await expect(page.getByRole('button', { name: 'Roll', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rolling…' })).not.toBeVisible()
  await expect(page.locator('.dice-roller__result')).not.toBeVisible()
  await expect(page.locator('.dice-roll-feed__entry')).toHaveCount(0)

  // Try a second, differently-malformed notation (partial dice term) to cover more than
  // one garbage-input shape without duplicating the whole test.
  await page.getByLabel('Dice Notation').fill('2d')
  await page.getByRole('button', { name: 'Roll', exact: true }).click()
  await expect(page.locator('.dice-roller__error')).toBeVisible()
  await expect(page.locator('.dice-roller__result')).not.toBeVisible()
  await expect(page.locator('.dice-roll-feed__entry')).toHaveCount(0)
})

test('Invalid map creation (non-positive grid dimension) shows a validation error and creates no map', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('dm_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByLabel('Signing in as a player').uncheck()
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/dm')

  await page.getByText('The Sunken Spire', { exact: true }).click()
  const campaign_detail_panel = page.locator('.campaign-detail-panel')
  await campaign_detail_panel.getByRole('button', { name: 'Maps' }).click()

  // Wait for the async load_maps() REST call (mock latency) to resolve before reading a
  // baseline count, otherwise this can race and read 0 before the seeded map renders.
  await expect(campaign_detail_panel.getByText('The Sunken Spire — Ground Floor', { exact: true })).toBeVisible()
  const initial_map_row_count = await campaign_detail_panel.locator('.campaign-detail-panel__map-row').count()

  await campaign_detail_panel.getByLabel('Name').fill('Bad Grid Map')
  await campaign_detail_panel.getByLabel('Grid Width').fill('0')
  await campaign_detail_panel.getByRole('button', { name: 'Create Map', exact: true }).click()

  await expect(campaign_detail_panel.locator('.campaign-detail-panel__map-form-error')).toBeVisible()
  await expect(campaign_detail_panel.locator('.campaign-detail-panel__map-form-error'))
    .toHaveText('Grid width and height must be positive whole numbers')

  // Absence of the unwanted outcome: no navigation to the map builder, no new map row,
  // and the attempted map's name doesn't show up anywhere (map_api.create is never called —
  // on_create_map_press (dm_dashboard_viewmodel.ts) returns before reaching it).
  await expect(page).toHaveURL('/dm')
  await expect(campaign_detail_panel.locator('.campaign-detail-panel__map-row')).toHaveCount(initial_map_row_count)
  await expect(page.getByText('Bad Grid Map', { exact: true })).not.toBeVisible()

  // A negative dimension is rejected the same way as zero.
  await campaign_detail_panel.getByLabel('Grid Width').fill('-5')
  await campaign_detail_panel.getByRole('button', { name: 'Create Map', exact: true }).click()
  await expect(campaign_detail_panel.locator('.campaign-detail-panel__map-form-error')).toBeVisible()
  await expect(page).toHaveURL('/dm')
  await expect(campaign_detail_panel.locator('.campaign-detail-panel__map-row')).toHaveCount(initial_map_row_count)
})

test('Unauthenticated access to DM-only or player-only routes redirects to /login', async ({ page }) => {
  const protected_routes = ['/dm', '/play', '/dm/map-builder/some-fake-map-id', '/play/dashboard/some-fake-character-id']

  for (const route of protected_routes) {
    await page.goto(route)
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: "Sam's Table" })).toBeVisible()
  }
})

// --- Permission-gated token move ---------------------------------------------------
//
// NOTE on feasibility (read before changing this test): the ticket's literal scenario —
// a player without can_move_tokens attempts to drag their token and it doesn't move —
// is not reachable through genuine browser interaction in the current app. Two
// independent, pre-existing gaps block it, verified by reading the source directly:
//
//   1. There is no player-facing map/token view at all. player_dashboard.tsx's "Live
//      Map" tab renders a static placeholder ("Live Map — coming soon"); MapScene (and
//      the TokenLayer component that contains the actual drag/permission-gating logic,
//      todo_views/map_view/token_layer.tsx's can_move_token()) is only ever mounted by
//      DM-only routes (dm_map_panel.tsx, todo_views/MapBuilder.tsx). No route mounts it
//      for a role: 'player' session, so a player can never even attempt this drag.
//
//   2. Even setting that aside, can_move_token() short-circuits to `true` whenever
//      role === 'dm' (see token_layer.tsx) — so the DM's own map view can't exhibit the
//      "denied" behavior for any user either, and forcing role to 'player' client-side
//      while mounted on a DM route would immediately trip RequireDM's redirect guard
//      (App.tsx), unmounting the map before any interaction could occur.
//
// So this test instead verifies the half of the permission system that IS genuinely
// reachable end-to-end: the DM's Permissions panel (dm_permission_panel.tsx) toggling
// can_move_tokens off for a joined player, and that toggle actually persisting server-side
// (not just an optimistic client-side flip). One more gap has to be worked around to even
// reach that: dm_dashboard_model.joined_players (which dm_permission_panel.tsx reads to
// know which players to render a row for) is populated only by a live 'player_joined'
// WebSocket broadcast — and mock_websocket.ts's connected_sockets list is scoped to a
// single page's own JS module instance (see fixtures.ts's comment on mock_store for the
// same limitation), so a broadcast from the player's page can never reach the DM's
// separate page. Unlike join codes (deliberately mirrored into localStorage for exactly
// this reason — see fixtures.ts's read/write_shared_join_codes), player_joined never
// got that treatment. To work around it, this test uses page.evaluate() with a dynamic
// import() of the app's own already-running model modules — Vite serves ES modules with
// native browser module caching, so importing the same resolved URL from page.evaluate()
// returns the exact same live singleton store the mounted React app is already using
// (confirmed empirically: mutating it through this path causes the real DM UI to
// re-render). This isn't a debug backdoor added to the source — it's the same dynamic
// import() mechanism the browser already exposes, used to reach state no window handle
// makes available, per the ticket's own suggested fallback for genuinely unobservable
// state.
test('DM can revoke a joined player\'s can_move_tokens permission, and it persists server-side', async ({ page, context }) => {
  const page_errors: Error[] = []
  page.on('pageerror', (error) => page_errors.push(error))

  await page.goto('/login')
  await page.getByLabel('Username').fill('dm_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByLabel('Signing in as a player').uncheck()
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/dm')

  await page.getByText('The Sunken Spire', { exact: true }).click()
  await page.locator('.campaign-detail-panel').getByRole('button', { name: 'Start Session' }).click()
  await expect(page.getByText('Join Code', { exact: true })).toBeVisible()
  const join_code = (await page.locator('.top-bar__right').getByText(/^[A-Z0-9]{6}$/).textContent())?.trim()
  expect(join_code).toMatch(/^[A-Z0-9]{6}$/)

  // A real player, in a real second page (same pattern as player_primary_flow.spec.ts),
  // genuinely joins the session with the real join code — this part is fully real.
  const player_page = await context.newPage()
  await player_page.goto('/login')
  await player_page.getByLabel('Username').fill('player_demo')
  await player_page.getByLabel('Password').fill('any-password')
  await player_page.getByRole('button', { name: 'Sign In' }).click()
  await expect(player_page).toHaveURL('/play')
  await expect(player_page.locator('.character-card')).toHaveCount(1)
  await player_page.locator('.character-card').first().click()
  await expect(player_page).toHaveURL(/\/play\/dashboard\//)
  await player_page.getByPlaceholder('Join Code').fill(join_code!)
  await player_page.getByRole('button', { name: 'Join' }).click()
  await expect(player_page.locator('.session-status-bar__join-error')).not.toBeVisible()
  await expect(player_page.getByPlaceholder('Join Code')).toHaveValue('')
  await player_page.close()

  // The DM's Permissions panel has no way to observe that real join across pages (see the
  // NOTE above) — inject the same 'player_joined' presence entry the mock's WebSocket
  // broadcast would have delivered had it not been page-scoped.
  const injected_joined_player = await page.evaluate(async () => {
    const dm_dashboard_model_module = await import('/src/models/dm_dashboard_model.ts')
    const fixtures_module = await import('/src/util/mock/fixtures.ts')
    dm_dashboard_model_module.dm_dashboard_model.getState().add_joined_player({
      user_id: fixtures_module.DEMO_PLAYER_USER_ID,
      character_name: 'Thorian Ashvale',
    })
    return fixtures_module.DEMO_PLAYER_USER_ID
  })

  const permission_panel = page.locator('.dm-permission-panel')
  const player_row = permission_panel.locator('.dm-permission-panel__row').filter({ hasText: 'Thorian Ashvale' })
  await expect(player_row).toBeVisible()

  // Seeded default (fixtures.ts's DEMO_PERMISSIONS) is can_move_tokens: true.
  const move_tokens_button = player_row.getByRole('button', { name: 'Can move tokens' })
  await expect(move_tokens_button).toHaveClass(/button--secondary/)

  await move_tokens_button.click()
  await expect(move_tokens_button).toHaveClass(/button--ghost/)
  await expect(move_tokens_button).not.toHaveClass(/button--secondary/)

  // Verify the toggle genuinely persisted server-side (not just the optimistic client
  // update toggle_permission applies immediately) by reading the mock backend's own
  // backing store directly, rather than inferring persistence indirectly through a UI
  // refetch (dm_permission_panel.tsx has no user-facing way to force one while in-session).
  await page.waitForTimeout(500)
  const persisted_permission = await page.evaluate(async (user_id) => {
    const fixtures_module = await import('/src/util/mock/fixtures.ts')
    const entries = fixtures_module.mock_store.permissions[fixtures_module.DEMO_CAMPAIGN_ID] ?? []
    return entries.find((entry) => entry.user_id === user_id)
  }, injected_joined_player)
  expect(persisted_permission?.can_move_tokens).toBe(false)

  expect(page_errors).toEqual([])
})
