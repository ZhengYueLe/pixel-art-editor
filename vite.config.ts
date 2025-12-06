import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copy } from 'vite-plugin-copy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/pixel-art-editor/',  // GitHub Pages 子路径部署
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        copy({
          targets: [
            {
              src: 'public/js/**/*',
              dest: 'dist/js',
              overwrite: true
            },
            {
              src: 'public/css/**/*',
              dest: 'dist/css',
              overwrite: true
            }
          ],
          verbose: true
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
