<template>
  <div>
    <vue-slider v-model="value"></vue-slider>
  </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

export default {
  components: {
    VueSlider
  },
  data: function () {
    return {
      value: 0,
    }
  },
  watch: {
    value(_new, _old){
      this.$emit('onmove', _new)
    }
  }
}
</script>
