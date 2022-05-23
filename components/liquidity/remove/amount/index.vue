<template>
  <div class="rl-amount">

    <div class="rl-amount--wrap-slide">
      <div class="rl-amount--title">63%</div>
      <div class="rl-amount--slide">
        <Slide @onmove="onmove" />
      </div>
      <div class="rl-amount--tags">
        <button type="button" class="rl-amount--tag">
          10%
        </button>
        <button type="button" class="rl-amount--tag">
          25%
        </button>
        <button type="button" class="rl-amount--tag">
          50%
        </button>
        <button type="button" class="rl-amount--tag">
          75%
        </button>
        <button type="button" class="rl-amount--tag">
          max
        </button>
      </div>
    </div>

    <div class="rl-amount--receive">
      <div class="title">
        You will receive
      </div>

      <div class="rl-amount--row">
        <div>
          Klay
        </div>
        <div>
          0.9198348
        </div>
      </div>

      <div class="rl-amount--row">
        <div>
          Klay
        </div>
        <div>
          5 721.0342
        </div>
      </div>

      <div class="rl-amount--row">
        <div>
          Klay per Klay
        </div>
        <div>
          5 721.0342
        </div>
      </div>

      <div class="rl-amount--row">
        <div>
          Klay per Klay
        </div>
        <div>
          5 721.0342
        </div>
      </div>




    </div>

  </div>
</template>

<script>
export default {
  methods: {
    onmove(v) {
      console.log({ v });
    },
  },
};
</script>

<style lang="scss" scoped src="./index.scss"/>
