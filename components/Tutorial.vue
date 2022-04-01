<template>
  <div class="wrap">
    <nuxt-link :to="switchLocalePath('en')">EN</nuxt-link>
    <nuxt-link :to="switchLocalePath('fr')">FR</nuxt-link>
    <nuxt-link :to="switchLocalePath('es')">ES</nuxt-link>
    <NuxtLogo/>
    <h1>{{ $t('welcome', { projectName: 'Klatn' }) }}</h1>
    <br>
    <p>{{ $t('lorem') }}</p>
    <br>
    <h2>{{ count }}</h2>
    <button @click="plus()">Plus</button>
    <button @click="minus()">Minus</button>
  </div>
</template>

<script>

export default {
  name: 'NuxtTutorial',
  computed: {
    count () {
      return this.$store.state.count.count
    }
  },
  methods: {
    plus (e) {
      this.$store.commit('count/plus')
    },
    minus (e) {
      this.$store.commit('count/minus')
    }
  }
}
</script>

<style lang="scss">
.wrap {
  max-width: 1100px;
  margin: auto;
  text-align: center;
  padding: 10px;


  & h1 {
    text-align: center;
    font-size: 63px;
    padding-top: 30px;
  }

  .nuxt-logo {
    height: 180px;
    display: block;
    margin: auto;
  }
}
</style>
