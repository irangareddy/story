import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/upload": "http://localhost:5000",
      "/books": "http://localhost:5000",
      "/clone": "http://localhost:5000",
      "/voices": "http://localhost:5000",
      "/narrate": "http://localhost:5000",
      "/stream": "http://localhost:5000",
      "/transcribe": "http://localhost:5000",
      "/transcriptions": "http://localhost:5000",
    },
  },
})
