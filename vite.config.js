import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // ✅ using SWC instead of old plugin

export default defineConfig({
  plugins: [react()],
})
