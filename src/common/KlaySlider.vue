<script>
// import VueSlider from 'vue-slider-component'
// import 'vue-slider-component/theme/antd.css'

export default {
  name: 'KlaySlider',
  components: {
    // VueSlider,
  },
  props: {
    propsValue: {
      type: Number,
    },
  },
  emits: ['move'],
  data() {
    return {
      value: this.propsValue,
    }
  },
  watch: {
    value(_new, _old) {
      this.$emit('move', _new)
    },
    propsValue() {
      this.value = this.propsValue
    },
  },
}
</script>

<template>
  <div>
    <!-- <VueSlider v-model="value" lazy /> -->
  </div>
</template>
