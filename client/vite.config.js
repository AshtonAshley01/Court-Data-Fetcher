import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This proxy configuration routes API calls from the frontend
    // to our backend server to prevent CORS issues during development.
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your backend's URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
