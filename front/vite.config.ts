import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'febrile-terri-nondiagrammatically.ngrok-free.dev'
    ]
  }
})
