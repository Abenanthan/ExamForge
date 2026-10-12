
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dynamically set base path:
// - Uses VITE_BASE_PATH if provided
// - Uses '/ExamForge/' when built by GitHub Actions (GitHub Pages)
// - Defaults to '/' for Vercel, local development, and root deployments
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/ExamForge/' : '/'),
})
