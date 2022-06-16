<template>
  <div>
    <vue-slider lazy v-model="value"></vue-slider>
  </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

export default {
  components: {
    VueSlider
  },
  props:{
    propsValue: {
      type: Number
    }
  },
  data: function () {
    return {
      value: this.propsValue,
    }
  },
  watch: {
    value(_new, _old){
      this.$emit('onmove', _new)
    },
    propsValue(){
      this.value = this.propsValue
    }
  }
}
</script>
