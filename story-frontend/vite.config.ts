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
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/upload": "http://127.0.0.1:5000",
      "/books": "http://127.0.0.1:5000",
      "/clone": "http://127.0.0.1:5000",
      "/voices": "http://127.0.0.1:5000",
      "/narrate": "http://127.0.0.1:5000",
      "/stream": "http://127.0.0.1:5000",
      "/transcribe": "http://127.0.0.1:5000",
      "/transcriptions": "http://127.0.0.1:5000",
      "/files": "http://127.0.0.1:5000",
    },
  },
})
