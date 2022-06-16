<script>
export default {
  name: 'HeaderMenu',
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
}
</script>

<template>
  <div class="list">
    <router-link
      v-for="it in items"
      :key="it.link"
      active-class="active"
      class="item"
      :to="it.link"
    >
      {{ it.label }}
    </router-link>
  </div>
</template>

<style scoped lang="scss">
.list {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: $white;
  border-radius: 16px;

  & .item {
    font-style: normal;
    font-weight: 700;
    font-size: 12px;
    line-height: 150%;
    padding: 9px 12px;
    border-radius: 10px;
    color: $dark;
  }

  & .item.active {
    background: $gray;
  }
}
</style>
