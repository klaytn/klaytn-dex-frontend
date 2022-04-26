<template>
  <div class="slippage">
    <Collapse>
      <template v-slot:head>
        <div class="slippage--head">
          <span class="label">
            Slippage tolerance
          </span>
          <Icon name="important"></Icon>
          <span class="percent">
            0.5%
          </span>
        </div>
      </template>

      <template v-slot:main>
        <div class="slippage--body">
          <button class="percent">0.1%</button>
          <button class="percent">0.5%</button>
          <button class="percent">1%</button>
          <button class="percent">3%</button>

          <input class="input" type="text">
        </div>
      </template>
    </Collapse>
  </div>
</template>
<script>
export default {
  name: 'Slippage',
}
</script>

<style lang="scss" scoped>

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
      margin-right: 8px;
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
      display: none;
    }
  }
}

</style>
