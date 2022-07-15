<script setup lang="ts" name="Slippage">
// const selectedPercent = ref(0.5)

// const swapStore = useSwapStore()
// const { slippagePercent } = toRefs(swapStore)
// const { setSlippage } = swapStore

// const renderPercent = computed(() => `${slippagePercent.value}%`)

// function input(value: number) {
//   if (value > 0 && value <= 10) setSlippage(value)
// }

// function select(value: number) {
//   selectedPercent.value = value
//   setSlippage(value)
// }
</script>

<template>
  <div>todo</div>
  <!-- <div class="slippage">
    <KlayCollapse>
      <template #head>
        <div class="slippage--head">
          <span class="label"> Slippage tolerance </span>
          <IconKlayImportant />
          <span class="percent">
            {{ renderPercent }}
          </span>
        </div>
      </template>

      <template #main>
        <div class="slippage--body">
          <button
            class="percent"
            @click="select(0.1)"
          >
            0.1%
          </button>
          <button
            class="percent"
            @click="select(0.5)"
          >
            0.5%
          </button>
          <button
            class="percent"
            @click="select(1)"
          >
            1%
          </button>
          <button
            class="percent"
            @click="select(3)"
          >
            3%
          </button>
          <input
            class="input"
            type="text"
            :placeholder="renderPercent"
            @input="input($event.target.value)"
          >
        </div>
      </template>
    </KlayCollapse>
  </div> -->
</template>

<style lang="scss" scoped>
@import '@/styles/vars.sass';
.slippage {
  &--head {
    display: flex;
    align-items: center;
    cursor: pointer;

    & .label {
      font-style: normal;
      font-weight: 700;
      font-size: 14px;
      line-height: 180%;
      color: $dark;
      margin-right: 5px;
      margin-bottom: 0;
    }

    & .percent {
      font-style: normal;
      font-weight: 700;
      font-size: 14px;
      line-height: 180%;
      color: $dark;
      margin-left: auto;
      margin-left: 8px;
    }
  }

  &--body {
    display: flex;
    align-items: center;
    margin-top: 10px;

    & .percent {
      font-style: normal;
      font-weight: 700;
      font-size: 12px;
      line-height: 150%;
      box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      padding: 7px 15px;
      margin-right: 8px;
      cursor: pointer;
    }

    & .input {
      margin-left: auto;
      background: $gray3;
      border-radius: 8px;
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 180%;
      color: $dark2;
      box-shadow: none;
      padding: 3px 8px;
      max-width: 88px;
      width: 100%;
    }
  }
}
</style>
