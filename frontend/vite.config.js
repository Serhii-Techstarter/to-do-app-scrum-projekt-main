import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  
  plugins: [react()],
  test: {
    globals: true, // Aktiviert globale Test-APIs wie describe, it, expect
    environment: 'jsdom', // Simuliert eine Browser-Umgebung für React-Komponenten
    exclude: [...configDefaults.exclude, 'node_modules/**'], // Schließt bestimmte Dateien aus
  },
})