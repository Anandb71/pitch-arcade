import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{target:'es2022',outDir:'dist/web',emptyOutDir:true,rollupOptions:{input:{play:resolve('apps/play/index.html'),overlay:resolve('apps/overlay/index.html'),dashboard:resolve('apps/dashboard/index.html'),chat:resolve('apps/dashboard/chat.html')}}}});
