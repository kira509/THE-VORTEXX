import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'  // ✅ correct import for SWC version

export default defineConfig({
  plugins: [react()],
})
