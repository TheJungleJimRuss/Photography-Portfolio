import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';
import { defineConfig } from 'vite';

function copyRootMedia() {
  return {
    name: 'copy-root-media',
    closeBundle() {
      const files = ['CATCAT.mp4', 'Puppy.mp4'];
      for (const file of files) {
        const src = resolve(import.meta.dirname, file);
        const dest = resolve(import.meta.dirname, 'dist', file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [copyRootMedia()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        contact: resolve(import.meta.dirname, 'contact.html')
      }
    }
  }
});
