<template>
  <p class="text-field" v-bind="$attrs" v-on="$listeners">
    <slot></slot>
  </p>
</template>

<style>
.text-field {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
