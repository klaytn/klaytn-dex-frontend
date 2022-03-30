export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'klaytn',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {hid: 'description', name: 'description', content: ''},
      {name: 'format-detection', content: 'telephone=no'}
    ],
    link: [
      {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    // Load a Node.js module directly (here it's a Sass file)
    'bulma',
    // CSS file in the project
    // '~/assets/css/main.css',
    // SCSS file in the project
    '~/assets/scss/main.scss'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxtjs/i18n',
  ],
  i18n: {
    locales: ['en', 'fr', 'es'],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        en: {
          welcome: 'Welcome {projectName}',
          lorem: 'Carrot manager, increased discounts. For, the mind, the body is held to choose what prevents them from themselves, at least, we foresee, these pleasures, pleasure. Nor is it to explain what hate responses?'
        },
        fr: {
          welcome: 'Bienvenue {projectName}',
          lorem: 'Gestionnaire de carottes, réductions accrues. Car, l\'esprit, le corps est tenu de choisir ce qui les empêche d\'eux-mêmes, du moins, nous le prévoyons, ces plaisirs, le plaisir. Ce n\'est pas non plus pour expliquer quelles réponses haineuses?'
        },
        es: {
          welcome: 'Bienvenido {projectName}',
          lorem: 'Gerente de zanahoria, mayores descuentos. Porque, la mente, el cuerpo se lleva a cabo para elegir lo que les impide de sí mismos, al menos, prevemos, estos placeres, placer. ¿Tampoco es para explicar qué respuestas de odio?'
        }
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {}
}
