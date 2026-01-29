import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  resolve: {
    alias: {
      path: path.resolve(__dirname, 'src/lib/mocks/pathMock.js'),
      fs: path.resolve(__dirname, 'src/lib/mocks/fsMock.js'),
    }
  },
  // Actually, for ggwave in browser, simpler is often better:
  // We can just ignore them if we know they aren't used.
  // But standard practice is empty polyfills.
  // Since we don't want to install extra packages right now, let's just alias to false/empty manually if possible, 
  // or use a simple object mock.
  // Vite doesn't support "false" like Webpack.
  // Let's try to just build options to externalize them if strictly needed, but the warning said they WERE externalized.
  // The warning is "Module has been externalized". This is actually what we want if we don't code that uses them.
  // To silence it, we can use build.rollupOptions.external
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['fs', 'path'],
    }
  }
})
