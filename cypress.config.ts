import { defineConfig } from 'cypress'

export default defineConfig({
  video: false,
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        resolve: {
          alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
          },
        },
      },
    },
  },
  screenshotOnRunFailure: false,
})
