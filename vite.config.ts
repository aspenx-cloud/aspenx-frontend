import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages deployment.
// For the default github.io URL (aspenx-cloud.github.io/aspenx-frontend/),
// keep this as '/aspenx-frontend/'.
// For a custom domain (aspenx.cloud), set VITE_BASE_PATH='/' in the workflow.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/aspenx-frontend/',
});
