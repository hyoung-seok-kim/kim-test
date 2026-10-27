import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `wrangler pages dev dist --port 8788` 를 함께 띄우면 /api 는 Functions 로 프록시된다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8788',
    },
  },
})
