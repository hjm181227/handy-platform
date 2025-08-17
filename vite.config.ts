import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'web',
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native/Libraries/StyleSheet/StyleSheet': 'react-native-web/dist/exports/StyleSheet',
      'react-native-webview': path.resolve(__dirname, 'src/components/WebViewBridge.web.tsx'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: '../web-build',
  },
});