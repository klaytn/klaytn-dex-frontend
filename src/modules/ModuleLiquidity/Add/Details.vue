<template>
  <div class="details">
    <h3>
      <slot name="title" />
    </h3>

    <slot />
  </div>
</template>

<style lang="scss" scoped>
.details {
  border: 1px solid #dfe4ed;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
  margin-top: 16px;
}

h3 {
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: $dark2;
}
</style>
