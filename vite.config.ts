import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      babel: {
        plugins: mode === 'development' ? [
          ['babel-plugin-transform-react-jsx-location', {
            attributeName: 'data-source'
          }]
        ] : []
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: 'VITE_',
  css: {
    devSourcemap: true,
  },
  esbuild: {
    sourcemap: mode === 'development',
    target: mode === 'development' ? 'es2022' : 'es2020',
  },
  build: {
    sourcemap: mode === 'development',
  },
}));
