<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { formatAddress } from '@/core'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import invariant from 'tiny-invariant'
import { storeToRefs } from 'pinia'
import { KlayIconCopy } from '~klay-icons'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

const show = useVModel(props, 'modelValue', emit)

const store = useDexStore()
const { account } = storeToRefs(store)
const addressFormatted = computed(() => account.value && formatAddress(account.value, 12))
const qrcode = useQRCode(
  computed(() => account.value ?? ''),
  {
    width: 195,
    margin: 0,
  },
)

const { copy } = useClipboard()
const { notify } = useNotify()

async function copyAddress() {
  invariant(account.value)
  await copy(account.value)
  notify({ type: 'ok', description: 'Your address was successfully copied' })
}
</script>

<template>
  <SModal v-model:show="show">
    <KlayModalCard
      title="Receive any token"
      class="w-[344px]"
    >
      <div class="flex items-end space-x-6 justify-center">
        <img
          class="image-render-pixel"
          :src="qrcode"
          alt="QR Code"
        >

        <KlayButton>dl</KlayButton>
      </div>

      <hr class="klay-divider my-4">

      <KlayButton
        class="w-full"
        @click="copyAddress"
      >
        {{ addressFormatted }}

        <template #icon>
          <KlayIconCopy />
        </template>
      </KlayButton>
    </KlayModalCard>
  </SModal>
</template>

<style scoped lang="scss">
@use '@/styles/vars';
</style>
