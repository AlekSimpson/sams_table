// VIEW layer — login page
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import { Button, Card, Input } from './components'
import '../../styles/login.css'

export default function Login() {
  const { login_page_model } = session_viewmodel()
  const model = login_page_model()

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__icon">⚔</span>
          <h1 className="auth-brand__title">Sam's Table</h1>
          <p className="auth-brand__subtitle">Your adventure awaits</p>
        </div>

        <div className="auth-form">
          <Input
            id="login-username-input"
            label="Username"
            type="text"
            value={model.username}
            onChange={model.on_username_change}
            onKeyDown={model.on_key_down}
            placeholder="Enter username"
            autoComplete="username"
          />

          <Input
            id="login-password-input"
            label="Password"
            type="password"
            value={model.password}
            onChange={model.on_password_change}
            onKeyDown={model.on_key_down}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          <label className="auth-toggle">
            <input
              type="checkbox"
              checked={model.dawning_player_role}
              onChange={model.on_role_toggle}
            />
            <span className="auth-toggle__label">
              Signing in as a player
            </span>
          </label>

          <Button variant="primary" full_width onClick={model.on_submit}>
            Sign In
          </Button>

          <div className="auth-divider"><span>or</span></div>

          <Button variant="ghost" full_width onClick={model.on_register_press}>
            Create Account
          </Button>
        </div>
      </Card>
    </div>
  )
}
