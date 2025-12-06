import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copy } from 'vite-plugin-copy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/pixel-art-app/',  // GitHub Pages 子路径部署（改成你的仓库名）
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(),
            copy({
      targets: [
        {
          src: 'js/**/*', // 项目根目录的js文件夹（所有文件）
          dest: 'dist/js', // 复制到dist/js
          overwrite: true
        }
      ],
      verbose: true // 打印复制日志（方便看结果）
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
