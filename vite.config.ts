import path from 'path'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import Inspect from 'vite-plugin-inspect'
import SvgLoader from '@soramitsu-ui/vite-plugin-svg'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import { RouteRecordRaw } from 'vue-router'
import KlaytnIcons from './etc/vite-plugin-klaytn-icons'
import AppAbi from './etc/vite-plugin-abi'

export default defineConfig({
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`,
      web3: 'web3/dist/web3.min.js',
      '@popperjs/core': '@popperjs/core/lib/index',
      '@soramitsu-ui/ui': process.env.NODE_ENV === 'test' ? '@soramitsu-ui/ui/dist/lib.cjs' : '@soramitsu-ui/ui',
      '@uniswap/v2-sdk': '@uniswap/v2-sdk/dist/v2-sdk.esm.js',
      '@uniswap/sdk-core': '@uniswap/sdk-core/dist/sdk-core.esm.js',
    },
  },

  define: {
    'import.meta.vitest': 'undefined',
  },

  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
      reactivityTransform: true,
    }),

    VueSetupExtend(),

    UnoCSS(),

    SvgLoader(),

    Icons({
      customCollections: {
        klay: FileSystemIconLoader('./src/assets/icons'),
      },
    }),

    KlaytnIcons(),

    AppAbi(),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ['vue', 'md'],
      extendRoute(route: RouteRecordRaw): null | undefined | RouteRecordRaw {
        // making them root-level
        if (route.path.match(/^(farms|pools|swap|liquidity)/)) {
          return { ...route, path: '/' + route.path }
        }
      },
      onRoutesGenerated(routes: RouteRecordRaw[]) {
        // default route
        routes.push({
          path: '/:catchAll(.*)*',
          redirect: '/swap',
        })
      },
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        'vue/macros',
        '@vueuse/head',
        '@vueuse/core',
        {
          '@vue-kakuyaku/core': [
            'useParamScope',
            'useDeferredScope',
            'useErrorRetry',
            'usePromise',
            'wheneverDone',
            'wheneverFulfilled',
            'wheneverRejected',
            'useStaleState',
            'flattenState',
            'useTask',
          ],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: [
        'src/composables',
        'src/store',
        'src/modules/ModuleFarming/store',
        'src/modules/ModuleStaking/store',
        'src/modules/ModuleGovernance/store',
        'src/modules/ModuleSwap/store',
        'src/modules/ModuleLiquidity/store',
      ],
      vueTemplate: true,
      eslintrc: {
        enabled: true,
      },
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: ['src/components/common', 'src/modules'],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: 'src/components.d.ts',
      directoryAsNamespace: true,
    }),

    // https://github.com/antfu/vite-plugin-pwa
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'Vitesse',
        short_name: 'Vitesse',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),

    // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [path.resolve(__dirname, 'locales/**')],
    }),

    // https://github.com/antfu/vite-plugin-inspect
    // Visit http://localhost:3333/__inspect/ to see the inspector
    Inspect(),
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    include: ['src/**/*.spec.ts'],
    includeSource: ['src/**/*.ts'],
    environment: 'jsdom',
    deps: {
      inline: ['@vue', '@vueuse', 'vue-demi'],
    },
  },

  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  build: {
    target: 'esnext',
  },

  server: {
    watch: {
      // Soramitsu Jenkins configures PNPM to make store in the working directory.
      // To workaround "System limit for number of file watchers reached" error,
      // this option is here
      ignored: ['**/.pnpm-store/**'],
    },
  },
})
