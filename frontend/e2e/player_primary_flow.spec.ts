// Real-browser end-to-end test of the core player journey, against the mock-backed dev
// server: login as a player -> create a character -> join a DM's session via a real join
// code -> edit the character sheet (HP, equipment) -> roll dice and see a result.
import { test, expect } from '@playwright/test'

const EQUIPMENT_ITEM_NAME = 'Potion of Healing'
const EDITED_CURRENT_HP = '7'
const DICE_NOTATION = '2d6+3'

test('Player can create a character, join a session, edit their sheet, and roll dice', async ({ page, context }) => {
  const page_errors: Error[] = []
  page.on('pageerror', (error) => page_errors.push(error))

  // --- DM setup, in a second page of the same browser context: log in as the seeded
  // dm_demo user and start a session on the seeded campaign to obtain a real join code.
  // A second page (not just a second browser context) is used deliberately: the mock
  // backend's join codes are mirrored into localStorage precisely so they're visible
  // across pages sharing the same browser context/origin (see fixtures.ts's
  // read/write_shared_join_codes) - a separate browser context would have isolated
  // storage and wouldn't see this DM page's join code at all.
  const dm_page = await context.newPage()
  await dm_page.goto('/login')
  await dm_page.getByLabel('Username').fill('dm_demo')
  await dm_page.getByLabel('Password').fill('any-password')
  await dm_page.getByLabel('Signing in as a player').uncheck()
  await dm_page.getByRole('button', { name: 'Sign In' }).click()
  await expect(dm_page).toHaveURL('/dm')

  await dm_page.getByText('The Sunken Spire', { exact: true }).click()
  await dm_page.locator('.campaign-detail-panel').getByRole('button', { name: 'Start Session' }).click()
  await expect(dm_page.getByText('Join Code', { exact: true })).toBeVisible()
  const join_code = (await dm_page.locator('.top-bar__right').getByText(/^[A-Z0-9]{6}$/).textContent())?.trim()
  expect(join_code).toMatch(/^[A-Z0-9]{6}$/)
  await dm_page.close()

  // --- Login as the seeded player_demo user (role checkbox defaults to player).
  // player_demo already owns one seeded character, so /play immediately redirects
  // (client-side) straight to that character's dashboard instead of an intermediate
  // picker page. ---
  await page.goto('/login')
  await page.getByLabel('Username').fill('player_demo')
  await page.getByLabel('Password').fill('any-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/play\/dashboard\//)

  // --- Create a new character via the dashboard sidebar's "+ New Character" affordance
  // (wait for the seeded character to appear in the sidebar first, giving a deterministic
  // before/after count). Creating a character immediately opens it, Notes.app-style, so
  // no separate click-to-open step is needed. ---
  await expect(page.locator('.character-sidebar-item')).toHaveCount(1)
  await page.getByRole('button', { name: 'New Character' }).click()
  await expect(page.locator('.character-sidebar-item')).toHaveCount(2)
  await expect(page).toHaveURL(/\/play\/dashboard\//)

  const character_name = await page.locator('.cs__char-name').inputValue()

  // --- Join the DM's session using the real join code obtained above ---
  await page.getByPlaceholder('Join Code').fill(join_code!)
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.locator('.session-status-bar__join-error')).not.toBeVisible()
  await expect(page.getByPlaceholder('Join Code')).toHaveValue('')

  // --- Edit current HP via the character sheet input ---
  const current_hp_input = page.getByTitle('Current HP')
  await current_hp_input.fill(EDITED_CURRENT_HP)
  await current_hp_input.press('Tab')
  await expect(current_hp_input).toHaveValue(EDITED_CURRENT_HP)

  // --- Add an equipment item ---
  await page.getByRole('button', { name: 'Equipment', exact: true }).click()
  await page.getByPlaceholder('Add equipment item').fill(EQUIPMENT_ITEM_NAME)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(EQUIPMENT_ITEM_NAME, { exact: true })).toBeVisible()

  // --- Verify both edits actually persisted (not just optimistic local state): switch
  // to the Live Map tab (unmounting CharacterSheet) and back (remounting it, which
  // re-fetches the character from the mock backend) ---
  await page.getByRole('button', { name: 'Live Map', exact: true }).click()

  // --- The Live Map tab renders the real, live MapScene (view mode) now that the player
  // has joined a session with an active map — not the old static placeholder ---
  await expect(page.locator('.player-dashboard__content canvas')).toBeVisible()
  await expect(page.getByText('Live Map — coming soon')).toHaveCount(0)

  // The old standalone "Character Sheet" nav button was replaced by the sidebar's
  // character list — re-selecting the currently-open character (its row is marked
  // active) is what switches the detail pane back to the sheet now.
  await page.locator('.character-sidebar-item--active').click()
  // The character store (character_model.ts) isn't reset on unmount, so the just-edited
  // value is still showing immediately after remount regardless of whether it actually
  // saved - only the refetch inside load_character's mock REST call (150-400ms simulated
  // latency, mock_config.ts) proves persistence. Wait for it to resolve before asserting,
  // so a broken save (reverting to the pre-edit server value) would actually be caught.
  await page.waitForTimeout(500)
  await expect(page.getByTitle('Current HP')).toHaveValue(EDITED_CURRENT_HP)
  await page.getByRole('button', { name: 'Equipment', exact: true }).click()
  await expect(page.getByText(EQUIPMENT_ITEM_NAME, { exact: true })).toBeVisible()

  // --- Use the dice roller to submit a valid roll and verify a result appears ---
  await page.getByRole('button', { name: 'Roll dice', exact: true }).click()
  await page.getByLabel('Dice Notation').fill(DICE_NOTATION)
  // The mock WebSocket (see mock_websocket.ts) only opens after a simulated 150-400ms
  // connection latency (mock_config.ts), with no DOM-visible "connected" signal to wait
  // on instead - rolling before it opens would have the roll request silently dropped
  // (see websockets.ts's send(), which warns and no-ops if the socket isn't open yet).
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Roll', exact: true }).click()

  await expect(page.locator('.dice-roller__result')).toBeVisible()
  await expect(page.locator('.dice-roller__result-total')).toContainText('Total:')
  // Not asserting an exact entry count here: this page has more than one component
  // independently holding its own mock WebSocket connection (the TopBar's join-code
  // form, DiceRoller, and DiceRollFeed all call websocket_hook() - see websockets.ts),
  // and the mock hub broadcasts to every open connection in the tab (mock_websocket.ts),
  // so a single roll can be dispatched into the shared feed's history more than once.
  // That's a pre-existing quirk of the mock's per-hook-call connection model, not
  // something this test needs to police - the feed just needs to show the roll.
  const feed_entry = page.locator('.dice-roll-feed__entry').first()
  await expect(feed_entry).toBeVisible()
  await expect(feed_entry).toContainText(character_name)
  await expect(feed_entry).toContainText(DICE_NOTATION)

  expect(page_errors).toEqual([])
})
