import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Increases the warning limit to 1000kb (1MB)
    rollupOptions: {
      output: {
        manualChunks: {
          // Splits Firebase into its own smaller chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Splits React into its own smaller chunk
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})