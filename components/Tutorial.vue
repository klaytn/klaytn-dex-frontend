<template>
  <div class="wrap">

    <div v-if="isNotInstalled">
      <h2>Please install kaikas to use the app</h2>
      <br>
      <p>
        You can install kaikas  <a href="https://docs.kaikas.io/" target="_blank">here</a>
      </p>
    </div>

    <div v-else-if="!address">
      <h2>Connect kaikas </h2>
      <br>
      <Button @click="connect()">Connect</Button>
    </div>

    <div v-else>
      <h2>Kaikas Connected!</h2>
      <br>
      <h3>your address is {{ address }}</h3>
    </div>

    <br>

  </div>
</template>

<script>

import {mapActions, mapState} from "vuex";

export default {
  name: 'NuxtTutorial',
  computed: {
    ...mapState('kaikas', ['address', 'isNotInstalled'])
  },
  methods: {
    ...mapActions({
      connect: 'kaikas/connect',
    }),
  },
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
