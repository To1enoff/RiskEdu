import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        // GitHub Pages for repo "RiskEdu" is hosted under /RiskEdu/
        base: mode === 'github' ? '/RiskEdu/' : '/',
        plugins: [react()],
        server: {
            host: true,
            port: 5173,
        },
    });
});
