// VIEWMODEL layer — session logic. The only session-related import Views need.
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { session_model } from '../models/session_model'
import { auth_api } from '../util/rest_client'
import { JWTClaims, Role } from '../types/app_types'
import { useState } from 'react'

export function session_viewmodel() {
  const { token, user, role, campaign_id, character_id, set_session, clear_session} = session_model()
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

  return {
    login_page_model,
    register_page_model,
    token,
    user,
    role,
    campaign_id,
    character_id,
    isAuthenticated: token !== null,
    isDM: role === 'dm',
    isPlayer: role === 'player',
    login,
    register,
    logout,
  }
}
