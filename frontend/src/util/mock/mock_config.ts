// Mock-backend gate + simulated-latency helper.
// Set VITE_USE_MOCK_BACKEND=false (e.g. in frontend/.env) to route rest_client.ts
// and websockets.ts through the real network instead of the in-memory fixtures.
export const MOCK_MODE_ENABLED = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

const MINIMUM_LATENCY_MILLISECONDS = 150
const MAXIMUM_LATENCY_MILLISECONDS = 400

/** Waits a random duration (150-400ms) to simulate real network latency. */
export function simulate_network_latency(): Promise<void> {
  const delay_milliseconds =
    MINIMUM_LATENCY_MILLISECONDS + Math.random() * (MAXIMUM_LATENCY_MILLISECONDS - MINIMUM_LATENCY_MILLISECONDS)
  return new Promise((resolve) => setTimeout(resolve, delay_milliseconds))
}

/** Runs `compute` after simulated network latency, mimicking an async REST round-trip. */
export async function resolve_after_latency<T>(compute: () => T): Promise<T> {
  await simulate_network_latency()
  return compute()
}
