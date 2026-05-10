// VIEW layer — login page
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import '../../styles/Login.css'

export default function Login() {
  const { login_page_model } = session_viewmodel()
  const model = login_page_model()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__icon">⚔</span>
          <h1 className="auth-brand__title">Sam's Table</h1>
          <p className="auth-brand__subtitle">Your adventure awaits</p>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="login-username-input"
              type="text"
              className="form-input"
              value={model.username}
              onChange={model.on_username_change}
              onKeyDown={model.on_key_down}
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password-input"
              type="password"
              className="form-input"
              value={model.password}
              onChange={model.on_password_change}
              onKeyDown={model.on_key_down}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <div className="form-group form-group--row">
            <label className="form-toggle">
              <input
                type="checkbox"
                checked={model.dawning_player_role}
                onChange={model.on_role_toggle}
              />
              <span className="form-toggle__label">
                Signing in as a player
              </span>
            </label>
          </div>

          <button className="btn btn--primary btn--full" onClick={model.on_submit}>
            Sign In
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button className="btn btn--ghost btn--full" onClick={model.on_register_press}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
