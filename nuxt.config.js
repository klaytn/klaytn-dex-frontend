export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: "klaytn",
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    // Load a Node.js module directly (here it's a Sass file)
    "bulma",
    // CSS file in the project
    // '~/assets/css/main.css',
    // SCSS file in the project
    "~assets/scss/main.css",
    "~assets/scss/vars.scss",
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    "~/plugins/kaikas.js",
    '~/plugins/notifications-client'
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: ["@nuxtjs/svg"],
  serverMiddleware: {
    "/api": "~/api",
  },
  // Modules: https://go.nuxtjs.dev/config-modules
  modules: ["@nuxtjs/i18n", "@nuxtjs/style-resources", "@nuxtjs/axios"],
  publicRuntimeConfig: {
    axios: {
      baseURL: "http://localhost:3000",
    },
  },
  styleResources: {
    scss: ["./assets/scss/*.scss"],
  },
  ssr: false, // Disable Server Side rendering
  i18n: {
    locales: ["en", "fr", "es"],
    defaultLocale: "en",
    vueI18n: {
      fallbackLocale: "en",
      messages: {
        en: {
          welcome: "Welcome {projectName}",
          lorem:
            "Carrot manager, increased discounts. For, the mind, the body is held to choose what prevents them from themselves, at least, we foresee, these pleasures, pleasure. Nor is it to explain what hate responses?",
        },
        fr: {
          welcome: "Bienvenue {projectName}",
          lorem:
            "Gestionnaire de carottes, r??ductions accrues. Car, l'esprit, le corps est tenu de choisir ce qui les emp??che d'eux-m??mes, du moins, nous le pr??voyons, ces plaisirs, le plaisir. Ce n'est pas non plus pour expliquer quelles r??ponses haineuses?",
        },
        es: {
          welcome: "Bienvenido {projectName}",
          lorem:
            "Gerente de zanahoria, mayores descuentos. Porque, la mente, el cuerpo se lleva a cabo para elegir lo que les impide de s?? mismos, al menos, prevemos, estos placeres, placer. ??Tampoco es para explicar qu?? respuestas de odio?",
        },
      },
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
}
