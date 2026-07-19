// VIEW layer — register page
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import { Button, Card, Input } from './components'
import '../../styles/login.css'

export default function Register() {
  const { register_page_model } = session_viewmodel()
  const model = register_page_model()

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__icon">⚔</span>
          <h1 className="auth-brand__title">Sam's Table</h1>
          <p className="auth-brand__subtitle">Create your account</p>
        </div>

        <div className="auth-form">
          <Input
            id="register-username-input"
            label="Username"
            type="text"
            value={model.username}
            onChange={model.on_username_change}
            onKeyDown={model.on_key_down}
            placeholder="Choose a username"
            autoComplete="username"
          />

          <Input
            id="register-password-input"
            label="Password"
            type="password"
            value={model.password}
            onChange={model.on_password_change}
            onKeyDown={model.on_key_down}
            placeholder="Choose a password"
            autoComplete="new-password"
          />

          <Button variant="primary" full_width onClick={model.on_submit}>
            Create Account
          </Button>

          <div className="auth-divider"><span>or</span></div>

          <Button variant="ghost" full_width onClick={model.on_sign_in_press}>
            Sign In
          </Button>
        </div>
      </Card>
    </div>
  )
}
