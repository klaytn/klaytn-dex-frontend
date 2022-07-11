<script setup lang="ts" name="KlayModal">
import { SModal } from '@soramitsu-ui/ui'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    width?: string
    bodyPadding?: string
  }>(),
  {
    label: '',
    width: '300',
    bodyPadding: '13px 16px 16px'
  },
)
const { label, width } = toRefs(props)

const emit = defineEmits<(event: 'update:modelValue', value: boolean) => void>()

const model = ref(props.modelValue)
watch(
  () => props.modelValue,
  (origin) => {
    model.value = origin
  },
)
watch(model, (dep) => {
  if (dep !== props.modelValue) {
    emit('update:modelValue', dep)
  }
})

const vBem = useBemClass()

</script>

<template>
  <SModal v-model:show="model">
    <div
      v-bem
      :style="{
        width: `${width}px`,
      }"
    >
      <div v-bem="'head'">
        <h3>{{ label || '' }}</h3>
        <button
          v-bem="'close'"
          type="button"
          @click="model = false"
        >
          <KlayIcon name="close" />
        </button>
      </div>
      <div
        v-bem="'body'"
        :style="{ padding: bodyPadding }"
      >
        <slot />
      </div>
    </div>
  </SModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.s-modal__modal
  background: transparent

.klay-modal
  text-align: left
  background: $white
  border-radius: 20px
  max-height: 90vh
  overflow: auto
  border-radius: 20px

  &__head
    display: flex
    align-items: center
    justify-content: space-between
    height: 65px
    width: 100%
    padding: 0 16px
    & h3
      font-style: normal
      font-weight: 700
      font-size: 18px
      line-height: 150%

  &__close
    cursor: pointer
</style>
