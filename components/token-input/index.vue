<template>
  <div class="token-input">
    <div class="token-value">
      <input placeholder="0.123" type="text">
      <button>MAX</button>
      <div class="select">
      </div>
    </div>
    <div class="token-meta">
      <span class="price">$142.57</span>
      <div class="row">
        <span class="price">Balace: 0.05754</span>
        <Icon name="important"></Icon>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.token {

  &-input {
    background: $gray3;
    padding: 16px 16px;
    border-radius: 8px;
  }

  &-value {
    display: flex;
    align-items: center;

    & input {
      font-style: normal;
      font-weight: 600;
      font-size: 30px;
      line-height: 130%;
      color: $dark2;
      background: transparent;
      border: none;
      max-width: 212px;
      width: 100%;
    }

    & button {
      font-weight: 700;
      font-size: 10px;
      line-height: 16px;
      background: $blue;
      border-radius: 8px;
      color: $white;
      padding: 4px 8px;
      margin-left: 8px;
    }

    & .select {
      width: 88px;
      height: 40px;
      background: $white;
      border-radius: 8px;
      box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.07);
      margin-left: 8px;
    }
  }

  &-meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    & .price {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: $gray4;
      margin-right: 6px;
    }

    & .row {
      display: flex;
      align-items: center;
    }
  }
}

</style>
