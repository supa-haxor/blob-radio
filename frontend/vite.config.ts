import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEV_PORT = 3000

// LAN: set `VITE_PUBLIC_HOST=192.168.x.y` in `.env.development.local` (gitignored via `*.local`)
// so script + HMR URLs use your Wi‑Fi IP instead of localhost / [::] (friends’ browsers otherwise break).

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const publicHost = env.VITE_PUBLIC_HOST?.trim() || undefined

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: DEV_PORT,
      strictPort: true,
      allowedHosts: true,
      watch: {
        usePolling: true,
      },
      hmr: {
        overlay: true,
        ...(publicHost
          ? { host: publicHost, port: DEV_PORT, clientPort: DEV_PORT }
          : { port: DEV_PORT, clientPort: DEV_PORT }),
      },
      ...(publicHost ? { origin: `http://${publicHost}:${DEV_PORT}` } : {}),
    },
  }
})
