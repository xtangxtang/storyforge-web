import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// 移除 crossorigin 属性，修复 Electron file:// 协议下 ES 模块加载问题
function removeCrossOrigin() {
  return {
    name: 'remove-crossorigin',
    closeBundle() {
      const htmlPath = path.resolve('dist/index.html');
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf-8');
        html = html.replace(/\s+crossorigin(?:="[^"]*")?/g, '');
        fs.writeFileSync(htmlPath, html);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  base: './',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
