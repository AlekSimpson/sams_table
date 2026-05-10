  ---
  First-time setup

  1. Create your .env file (one time only):
  cp .env.example .env

  Then open .env and set real values:
  DB_PASSWORD=anything_you_want        # Postgres password
  JWT_SECRET=a_long_random_string_32+  # Sign JWTs — keep this secret
  PORT=8080
  ASSET_STORAGE_PATH=./uploads

  For JWT_SECRET, generate a proper random value:
  openssl rand -base64 32

  ---
  Running the project

  Start everything (builds images + starts all 3 containers):
  docker compose up --build

  Start without rebuilding (faster, after first run):
  docker compose up

  Stop everything:
  docker compose down

  Stop and wipe the database (useful when resetting):
  docker compose down -v
  The -v flag removes the named volumes (pgdata, uploads). Without it, your DB data persists between restarts.

  ---
  What's running after up

  ┌────────────────┬──────────────────────────┬───────────────────────────────────┐
  │    Service     │           URL            │            What it is             │
  ├────────────────┼──────────────────────────┼───────────────────────────────────┤
  │ Frontend       │ http://localhost         │ React app (nginx)                 │
  ├────────────────┼──────────────────────────┼───────────────────────────────────┤
  │ Backend API    │ http://localhost/api/... │ Go server (proxied by nginx)      │
  ├────────────────┼──────────────────────────┼───────────────────────────────────┤
  │ WebSocket      │ ws://localhost/ws        │ Proxied by nginx to Go            │
  ├────────────────┼──────────────────────────┼───────────────────────────────────┤
  │ Backend direct │ http://localhost:8080    │ Go server (bypasses nginx)        │
  ├────────────────┼──────────────────────────┼───────────────────────────────────┤
  │ Postgres       │ localhost:5432           │ Only reachable from inside Docker │
  └────────────────┴──────────────────────────┴───────────────────────────────────┘

  The DB migrations run automatically on backend startup — you never need to run them manually.

  ---
  Development workflow (without Docker)

  When you're actively writing code you don't want to rebuild the Docker image on every change. Run each piece locally instead:

  Backend (requires Go installed):
  # In one terminal, from project root:
  cp .env.example .env   # if not done already
  cd backend
  go run ./cmd/server

  Frontend (requires Node installed):
  # In another terminal:
  cd frontend
  npm run dev
  Vite's dev server proxies /api and /ws to localhost:8080 automatically (configured in vite.config.ts), so you just open http://localhost:5173.

  Database (if running backend locally, you still need Postgres):
  # Start only the DB container:
  docker compose up db

  ---
  Other useful commands

  Rebuild only one service (e.g. after a backend change):
  docker compose up --build backend

  View logs from a specific service:
  docker compose logs -f backend
  docker compose logs -f frontend
  docker compose logs -f db

  Open a Postgres shell:
  docker compose exec db psql -U postgres -d sams_table

  Check backend is responding:
  curl http://localhost/api/auth/login
  # Should return: {"error":"not implemented"}
