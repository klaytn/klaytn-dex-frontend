<script setup lang="ts">
import invariant from 'tiny-invariant'

const store = useDexStore()
const address = toRef(store, 'account')

const { copy } = useClipboard()
const copied = refAutoReset(false, 1000)

async function copyAddress() {
  invariant(address.value)
  await copy(address.value)
  copied.value = true
}
</script>

<template>
  <span
    v-if="address"
    class="flex space-x-3"
  >
    <span :class="$style.text">
      <FormatAddress
        :value="address"
        :length="6"
      />
    </span>
    <IconCopyCheck
      :check="copied"
      :class="[$style.icon, { 'cursor-pointer': !copied }]"
      @click="copyAddress()"
    />
  </span>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.text {
  font-size: 14px;
  font-weight: 700;
}

.icon {
  color: vars.$gray3;
  height: 15px;
  width: 15px;
}
</style>
