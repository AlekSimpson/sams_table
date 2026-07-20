import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { session_viewmodel } from './viewmodels/session_viewmodel'
import Login from './views/login'
import Register from './views/register'
import DMDashboard from './views/dm_dashboard'
import PlayerView from './views/player_view'
import MapBuilder from './views/map_builder'
import PlayerDashboard from './views/player_dashboard'

/** Redirects to /login if no valid session exists. */
function RequireAuth() {
  const { isAuthenticated } = session_viewmodel()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

/** Redirects non-DM users away from DM routes. */
function RequireDM() {
  const { isDM } = session_viewmodel()
  return isDM ? <Outlet /> : <Navigate to="/play" replace />
}

/** Redirects non-player users away from player routes. */
function RequirePlayer() {
  const { isPlayer } = session_viewmodel()
  return isPlayer ? <Outlet /> : <Navigate to="/dm" replace />
}

/** Sends unknown paths to the user's own dashboard if authenticated, or /login otherwise. */
function CatchAll() {
  const { isAuthenticated, isDM } = session_viewmodel()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={isDM ? '/dm' : '/play'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route element={<RequireDM />}>
            <Route path="/dm" element={<DMDashboard />} />
            <Route path="/dm/map-builder/:map_id" element={<MapBuilder />} />
          </Route>

          <Route element={<RequirePlayer />}>
            <Route path="/play" element={<PlayerView />} />
            <Route path="/play/dashboard/:character_id" element={<PlayerDashboard />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </BrowserRouter>
  )
}
