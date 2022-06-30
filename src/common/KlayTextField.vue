<script setup lang="ts" name="KlayTextField" />

<template>
  <p
    class="text-field"
    v-bind="$attrs"
  >
    <slot />
  </p>
</template>

<style>
.text-field {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
