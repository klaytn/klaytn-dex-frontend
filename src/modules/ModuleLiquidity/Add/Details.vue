<template>
  <div class="details p-4 space-y-4">
    <h3>
      <slot name="title" />
    </h3>

    <p>
      <slot />
    </p>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.details {
  border: 1px solid #dfe4ed;
  border-radius: 8px;
}

h3 {
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  color: $dark2;
}
</style>
