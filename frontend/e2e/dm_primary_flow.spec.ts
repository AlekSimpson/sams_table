// Real-browser end-to-end test of the core DM journey, against the mock-backed dev
// server: register/login as DM -> create campaign -> create map -> start session ->
// place a tile -> toggle sidebar -> set initiative -> end session.
import { test, expect } from '@playwright/test'

const CAMPAIGN_NAME = 'Ember Hollow'
const MAP_NAME = 'Grand Hall'
const MAP_GRID_WIDTH = '15'
const MAP_GRID_HEIGHT = '12'

test('DM can run a full session: campaign, map, session, tile, combat controls', async ({ page }) => {
  const page_errors: Error[] = []
  page.on('pageerror', (error) => page_errors.push(error))

  // --- Login as the seeded dm_demo user, switching the role toggle off "player" ---
  await page.goto('/login')
  await page.getByLabel('Username').fill('dm_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByLabel('Signing in as a player').uncheck()
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL('/dm')
  await expect(page.getByText('DM Dashboard', { exact: true })).toBeVisible()

  // --- Create a campaign via the sidebar's "+ New Campaign" modal ---
  await page.getByRole('button', { name: 'New Campaign' }).click()
  await page.getByLabel('Name').fill(CAMPAIGN_NAME)
  await page.getByRole('button', { name: 'Create Campaign' }).click()

  const campaign_sidebar_item = page.locator('.sidebar').getByText(CAMPAIGN_NAME, { exact: true })
  await expect(campaign_sidebar_item).toBeVisible()

  // --- Select it, then create a map with explicit grid dimensions ---
  await campaign_sidebar_item.click()
  const campaign_detail_panel = page.locator('.campaign-detail-panel')
  await expect(campaign_detail_panel.getByText(CAMPAIGN_NAME, { exact: true })).toBeVisible()

  await campaign_detail_panel.getByRole('button', { name: 'Maps' }).click()
  await campaign_detail_panel.getByLabel('Name').fill(MAP_NAME)
  await campaign_detail_panel.getByLabel('Grid Width').fill(MAP_GRID_WIDTH)
  await campaign_detail_panel.getByLabel('Grid Height').fill(MAP_GRID_HEIGHT)
  await campaign_detail_panel.getByRole('button', { name: 'Create Map', exact: true }).click()

  // Successful creation navigates to the map builder route.
  await expect(page).toHaveURL(/\/dm\/map-builder\//)
  await expect(page.locator('canvas')).toBeVisible()

  // --- Exit the map builder via its top-bar button (not the browser back button):
  // campaign detail should now list the created map ---
  await page.getByRole('button', { name: 'Exit Map Builder' }).click()
  await expect(page).toHaveURL('/dm')
  await campaign_detail_panel.getByRole('button', { name: 'Maps' }).click()
  await expect(campaign_detail_panel.getByText(MAP_NAME, { exact: true })).toBeVisible()
  await expect(campaign_detail_panel.getByText(`${MAP_GRID_WIDTH} × ${MAP_GRID_HEIGHT}`)).toBeVisible()

  // --- Start the session: join code becomes visible, layout switches to in-session ---
  await campaign_detail_panel.getByRole('button', { name: 'Start Session' }).click()
  await expect(page.getByText('Join Code', { exact: true })).toBeVisible()
  await expect(page.locator('.top-bar__right').getByText(/^[A-Z0-9]{6}$/)).toBeVisible()

  // Select the created map so the 3D canvas + asset catalogue mount.
  await page.getByLabel('Active map').selectOption({ label: MAP_NAME })
  const map_canvas = page.locator('canvas')
  await expect(map_canvas).toBeVisible()

  // --- Place a tile: select a default asset, then click the canvas ---
  const asset_catalogue_panel = page.locator('.asset-catalogue-panel')
  const floor_tile_button = asset_catalogue_panel.getByRole('button', { name: 'floor_1x1', exact: true })
  await floor_tile_button.click()
  await expect(floor_tile_button).toHaveClass(/button--secondary/)

  // A successful placement surfaces a DOM-visible "Tile placed" confirmation toast
  // (dm_map_panel.tsx) once place_map_tile's REST persistence actually resolves -
  // this is the real, non-3D-canvas signal a DM sees on success.
  await map_canvas.click()
  await expect(page.getByText('Tile placed')).toBeVisible()
  await expect(map_canvas).toBeVisible()

  // --- Toggle the in-session sidebar collapse (and back, so Combat Controls stays usable) ---
  const in_session_sidebar = page.locator('.sidebar--right')
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(in_session_sidebar).toHaveClass(/sidebar--collapsed/)
  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  await expect(in_session_sidebar).not.toHaveClass(/sidebar--collapsed/)

  // --- Combat controls action: add an NPC initiative entry and publish the order ---
  const combat_controls_panel = page.locator('.dm-combat-controls-panel')
  await combat_controls_panel.getByLabel('NPC name').fill('Goblin Scout')
  await combat_controls_panel.getByLabel('NPC initiative').fill('15')
  await combat_controls_panel.getByRole('button', { name: 'Add NPC' }).click()
  await expect(combat_controls_panel.getByText('Goblin Scout (15)')).toBeVisible()
  await combat_controls_panel.getByRole('button', { name: 'Publish Order' }).click()

  // --- End the session: join code disappears, dashboard returns to pre-session layout ---
  await page.getByRole('button', { name: 'End Session' }).click()
  await expect(page.getByText('Join Code', { exact: true })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Start Session' })).toBeVisible()
  await expect(campaign_sidebar_item).toBeVisible()

  expect(page_errors).toEqual([])
})

test('DM can open a character\'s live sheet from the Characters tab and return to the list', async ({ page }) => {
  const page_errors: Error[] = []
  page.on('pageerror', (error) => page_errors.push(error))

  // --- Login as the seeded dm_demo user, who already owns the seeded demo campaign
  // ("The Sunken Spire") complete with pre-seeded characters ---
  await page.goto('/login')
  await page.getByLabel('Username').fill('dm_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByLabel('Signing in as a player').uncheck()
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL('/dm')

  const campaign_sidebar_item = page.locator('.sidebar').getByText('The Sunken Spire', { exact: true })
  await campaign_sidebar_item.click()

  const campaign_detail_panel = page.locator('.campaign-detail-panel')
  await expect(campaign_detail_panel.getByText('The Sunken Spire', { exact: true })).toBeVisible()

  // Characters tab is the default — select a seeded character and confirm the real,
  // live CharacterSheet component renders in place of the row list.
  await expect(campaign_detail_panel.getByText('Thorian Ashvale', { exact: true })).toBeVisible()
  await campaign_detail_panel.getByText('Thorian Ashvale', { exact: true }).click()

  const character_sheet_frame = campaign_detail_panel.locator('.campaign-detail-panel__character-sheet-frame')
  await expect(character_sheet_frame.locator('.cs__char-name')).toHaveValue('Thorian Ashvale')
  await expect(character_sheet_frame.locator('.cs__hp-max')).toHaveValue('44')
  await expect(character_sheet_frame.locator('.cs__ability-score[title="Strength"]')).toHaveValue('16')

  // --- Navigate back to the character list via the "Back to characters" affordance ---
  await character_sheet_frame.getByRole('button', { name: /Back to characters/ }).click()
  await expect(campaign_detail_panel.locator('.campaign-detail-panel__list')).toBeVisible()
  await expect(campaign_detail_panel.getByText('Thorian Ashvale', { exact: true })).toBeVisible()

  expect(page_errors).toEqual([])
})

test('DM can embed the live map editor from the Maps tab without navigating to the standalone map builder', async ({ page }) => {
  const page_errors: Error[] = []
  page.on('pageerror', (error) => page_errors.push(error))

  // --- Login as the seeded dm_demo user, who already owns the seeded demo campaign
  // ("The Sunken Spire") complete with a pre-seeded map ---
  await page.goto('/login')
  await page.getByLabel('Username').fill('dm_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByLabel('Signing in as a player').uncheck()
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL('/dm')

  const campaign_sidebar_item = page.locator('.sidebar').getByText('The Sunken Spire', { exact: true })
  await campaign_sidebar_item.click()

  const campaign_detail_panel = page.locator('.campaign-detail-panel')
  await expect(campaign_detail_panel.getByText('The Sunken Spire', { exact: true })).toBeVisible()

  await campaign_detail_panel.getByRole('button', { name: 'Maps' }).click()
  await expect(campaign_detail_panel.getByText('The Sunken Spire — Ground Floor', { exact: true })).toBeVisible()

  // Select the seeded map: the live map + full build tools embed directly in the
  // pane (no navigation to the standalone /dm/map-builder/:map_id route).
  await campaign_detail_panel.getByText('The Sunken Spire — Ground Floor', { exact: true }).click()
  await expect(page).toHaveURL('/dm')

  const map_editor_frame = campaign_detail_panel.locator('.campaign-detail-panel__map-editor-frame')
  await expect(map_editor_frame.locator('canvas')).toBeVisible()
  await expect(map_editor_frame.locator('.asset-catalogue-panel')).toBeVisible()

  // This embedded, pre-session usage must not show session-only chrome — no
  // "hide from players" broadcast toggle, which only makes sense in-session.
  await expect(map_editor_frame.getByText('Hide map from players')).not.toBeVisible()

  // --- Navigate back to the map list via the "Back to maps" affordance ---
  await map_editor_frame.getByRole('button', { name: /Back to maps/ }).click()
  await expect(campaign_detail_panel.locator('.campaign-detail-panel__list')).toBeVisible()
  await expect(campaign_detail_panel.getByText('The Sunken Spire — Ground Floor', { exact: true })).toBeVisible()

  expect(page_errors).toEqual([])
})
