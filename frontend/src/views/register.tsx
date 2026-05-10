// VIEW layer — register page
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import '../../styles/Login.css'

export default function Register() {
  const { register_page_model } = session_viewmodel()
  const model = register_page_model()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__icon">⚔</span>
          <h1 className="auth-brand__title">Sam's Table</h1>
          <p className="auth-brand__subtitle">Create your account</p>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="register-username-input"
              type="text"
              className="form-input"
              value={model.username}
              onChange={model.on_username_change}
              onKeyDown={model.on_key_down}
              placeholder="Choose a username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="register-password-input"
              type="password"
              className="form-input"
              value={model.password}
              onChange={model.on_password_change}
              onKeyDown={model.on_key_down}
              placeholder="Choose a password"
              autoComplete="new-password"
            />
          </div>

          <button className="btn btn--primary btn--full" onClick={model.on_submit}>
            Create Account
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button className="btn btn--ghost btn--full" onClick={model.on_sign_in_press}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
