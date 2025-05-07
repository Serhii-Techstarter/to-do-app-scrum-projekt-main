1. vitest installieren - zum Terminal "npm install -D vitest" schreiben
2. Test Ordner erstellen
3. test Skript zum package.json hinzufügen - "npm test"
4. npm install --save-dev @testing-library/react
5. npm install --save-dev @testing-library/jest-dom jsdom
6. vite.config.js aktualisieren:

```js
    import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
```
