<template>
  <button v-bind="$attrs" v-on="$listeners" class="btn">
    <slot></slot>
  </button>
</template>

<style>
.btn {
  background: #D0021B;
  border: 0;
  font-style: normal;
  font-weight: 700;
  font-size: 12px;
  color: #fff;
  border-radius: 4px;
  padding: 9px 13px;
  cursor: pointer;
}
</style>

<script>
export default {
  name: 'Button',
  props: {
    text: {
      type: String,
      required: true
    }
  }
}
</script>
