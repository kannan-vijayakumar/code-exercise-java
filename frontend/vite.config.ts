import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/govuk-frontend/dist/govuk/assets/fonts/**/*',
          dest: 'assets/fonts',
          rename: {
            stripBase: true,
          },
        },
        {
          src: 'node_modules/govuk-frontend/dist/govuk/assets/images/**/*',
          dest: 'assets/images',
          rename: {
            stripBase: true,
          },
        },
        {
          src: 'node_modules/govuk-frontend/dist/govuk/assets/manifest.json',
          dest: 'assets',
          rename: {
            stripBase: true,
          },
        },
      ],
    }),
  ],
  css: {
    lightningcss: {
      errorRecovery: true,
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
