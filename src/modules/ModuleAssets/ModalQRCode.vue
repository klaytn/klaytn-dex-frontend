<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { formatAddress } from '@/core'
import QRCode from 'qrcode'
import invariant from 'tiny-invariant'
import { storeToRefs } from 'pinia'
import { KlayIconCopy } from '~klay-icons'

const store = useDexStore()
const { account } = storeToRefs(store)

const { notify } = useNotify()

const props = defineProps<{
  modelValue: boolean
}>()
const { modelValue } = toRefs(props)
const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

const show = useVModel(props, 'modelValue', emit)

const addressFormatted = computed(() => account.value && formatAddress(account.value, 12))

const qrUrl = ref<string | null>(null)

const { copy, copied } = useClipboard()

function copyAddress() {
  invariant(account.value, 'there is no account')
  copy(account.value)
}

watch(copied, (value) => {
  if (value) {
    notify({ type: 'ok', description: 'Your address was successfully copied' })
  }
})

watch(modelValue, () => {
  if (modelValue.value) {
    nextTick(async () => {
      invariant(account.value, 'there is no account')
      qrUrl.value = await QRCode.toDataURL(account.value, { margin: 0 })
    })
  }
})
</script>

<template>
  <SModal
    v-model:show="show"
  >
    <KlayModalCard
      title="Receive any token"
      class="w-[420px]"
    >
      <img
        v-if="qrUrl"
        class="qr w-[195px] mx-[22px]"
        :src="qrUrl"
      >
      <hr class="klay-divider my-4">
      <div class="address">
        {{ addressFormatted }}
        <KlayIconCopy @click="copyAddress" />
      </div>
    </KlayModalCard>
  </SModal>
</template>

<style scoped>
.qr {
  width: 195px;
  image-rendering: pixelated;
}
</style>
