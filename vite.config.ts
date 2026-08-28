import { defineConfig } from 'vite'
import { globSync } from 'glob'

// Every root-level page plus every case study becomes a build entry.
// docs/ is not matched, so the template never ships.
export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        globSync(['*.html', 'case-studies/**/index.html']).map((file) => [
          file.replace(/\.html$/, '').replace(/\//g, '-'),
          file,
        ])
      ),
    },
  },
})