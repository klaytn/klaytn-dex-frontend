<template>
  <div class="collapse">
    <div class="collapse--head">
    <span class="label">
      {{label}}
    </span>

      <Icon name="important"></Icon>

      <span class="percent">0.5%</span>

      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
       <Icon name="important"></Icon>
      </svg>

    </div>
  </div>
</template>

<script>
export default {
  name: "Collapse",
  props: {
    label: String,
    required: true
  }
}
</script>

<style scoped lang="scss">
.collapse {
  border: 1px solid $gray3;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 8px 16px;
  background: $white;

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
}
</style>
