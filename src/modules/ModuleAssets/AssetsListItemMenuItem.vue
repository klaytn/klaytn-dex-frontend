<template>
  <div class="px-4 py-2 select-none cursor-pointer">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

div {
  font-size: 14px;
  font-weight: 700;

  &:hover {
    color: vars.$blue;
    background: vars.$gray7;
  }
}
</style>
