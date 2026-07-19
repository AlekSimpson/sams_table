// VIEWMODEL layer — session logic. The only session-related import Views need.
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { session_model } from '../models/session_model'
import { auth_api, session_api } from '../util/rest_client'
import { websocket_hook } from '../util/websockets'
import { JWTClaims, Role } from '../types/app_types'
import { PlayerJoinedPayload } from '../types/websocket_types'
import { useState } from 'react'

export function session_viewmodel() {
  const { token, user, role, campaign_id, character_id, active_map_id, set_session, clear_session, set_campaign_session } = session_model()
  const navigate = useNavigate()

  function login_page_model() {
    const [username, set_username] = useState("")
    const [password, set_password] = useState("")
    const [dawning_player_role, set_dawning_player_role] = useState(true)

    const on_username_change = (event: React.ChangeEvent<HTMLInputElement>) => set_username(event.target.value)
    const on_password_change = (event: React.ChangeEvent<HTMLInputElement>) => set_password(event.target.value)
    const on_role_toggle     = () => set_dawning_player_role(!dawning_player_role)
    const on_submit          = () => login(username, password, dawning_player_role ? 'player' : 'dm')
    const on_register_press  = () => navigate('/register')
    const on_key_down        = (event: React.KeyboardEvent) => { if (event.key === 'Enter') on_submit() }

    return {
      username,
      set_username,
      password,
      set_password,
      dawning_player_role,
      set_dawning_player_role,
      navigate,
      on_username_change,
      on_password_change,
      on_role_toggle,
      on_submit,
      on_register_press,
      on_key_down
    }
  }

  const login = useCallback(
    async (username: string, password: string, role_selection: Role) => {
      const result = await auth_api.login(username, password)
      const payload = JSON.parse(atob(result.token.split('.')[1])) as JWTClaims
      payload.role = role_selection

      set_session(result.token, payload as JWTClaims, result.user)
      navigate(payload.role === 'dm' ? '/dm' : '/play')
    },
    [set_session, navigate]
  )

  const register = useCallback(
    async (username: string, password: string) => {
      const result = await auth_api.register(username, password)
      const payload = JSON.parse(atob(result.token.split('.')[1])) as JWTClaims

      set_session(result.token, payload as JWTClaims, result.user)
      navigate('/login')
    },
    [set_session, navigate]
  )

  const logout = useCallback(() => {
    clear_session()
  }, [clear_session])

  function register_page_model() {
    const [username, set_username] = useState("")
    const [password, set_password] = useState("")

    const on_username_change = (event: React.ChangeEvent<HTMLInputElement>) => set_username(event.target.value)
    const on_password_change = (event: React.ChangeEvent<HTMLInputElement>) => set_password(event.target.value)
    const on_submit          = () => register(username, password)
    const on_sign_in_press   = () => navigate('/login')
    const on_key_down        = (event: React.KeyboardEvent) => { if (event.key === 'Enter') on_submit() }
    return {
      username,
      set_username,
      password,
      set_password,
      on_username_change,
      on_password_change,
      on_submit,
      on_sign_in_press,
      on_key_down
    }
  }

  /** Player: top-bar join-code form state. Opens this client's WS connection (via
   *  websocket_hook — see util/websockets.ts) since PlayerDashboard, where this is
   *  used, is currently the only mounted player-side route that needs one. On submit,
   *  validates the code against session_api.join, stores the returned campaign context,
   *  and broadcasts a real player_joined event carrying this character's actual info —
   *  see mock_websocket.ts for why the ST-48 demo player_joined simulation was removed
   *  in favor of this. */
  function join_code_model() {
    const { send } = websocket_hook()
    const [join_code_draft, set_join_code_draft] = useState('')
    const [is_joining, set_is_joining] = useState(false)
    const [join_error, set_join_error] = useState<string | null>(null)

    const on_join_code_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_join_code_draft(event.target.value)
      if (join_error) set_join_error(null)
    }

    const on_submit = async (character_name: string) => {
      const trimmed_code = join_code_draft.trim()
      if (!trimmed_code) return
      set_is_joining(true)
      set_join_error(null)
      try {
        const response = await session_api.join(trimmed_code)
        set_campaign_session(response.campaign_id, response.active_map_id)
        send<PlayerJoinedPayload>('player_joined', {
          campaign_id: response.campaign_id,
          user_id: user?.id ?? '',
          character_name,
        })
        set_join_code_draft('')
      } catch (error) {
        set_join_error(error instanceof Error ? error.message : 'Invalid join code')
      } finally {
        set_is_joining(false)
      }
    }

    return {
      join_code_draft,
      on_join_code_change,
      is_joining,
      join_error,
      on_submit,
    }
  }

  return {
    login_page_model,
    register_page_model,
    join_code_model,
    token,
    user,
    role,
    campaign_id,
    character_id,
    active_map_id,
    isAuthenticated: token !== null,
    isDM: role === 'dm',
    isPlayer: role === 'player',
    login,
    register,
    logout,
  }
}
