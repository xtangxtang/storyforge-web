import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';

// 仅构建 Electron 主进程和 preload，不碰 dist/
export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: false,
  },
  plugins: [
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            emptyOutDir: true,
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            emptyOutDir: false,
          },
        },
      },
    ]),
  ],
});
