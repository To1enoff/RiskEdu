import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // GitHub Pages for repo "RiskEdu" is hosted under /RiskEdu/
  base: mode === 'github' ? '/RiskEdu/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
