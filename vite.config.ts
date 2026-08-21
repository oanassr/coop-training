import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// نستخدم مسار نسبي حتى يعمل على GitHub Pages تحت اسم المستودع دون إعدادات إضافية.
// التوجيه يعتمد HashRouter فلا يتأثر بمسار القاعدة.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
  },
})
