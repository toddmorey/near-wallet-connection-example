// https://vitejs.dev/config/
export default defineConfig({
    server: {
      proxy: {
        '/api': {
          target: 'http://auth.testnet.onmachina.io/auth/v1',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      cors: false,
    }
  })