import path from 'path'

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'awp/www/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    outDir: 'distweb',
    target: 'es2019',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        compact: true,
        minifyInternalExports: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'awp/www')
    }
  },
  server: {
    fs: {
      strict: false
    }
  }
}) 