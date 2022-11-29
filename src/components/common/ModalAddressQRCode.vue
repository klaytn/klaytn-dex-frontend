<script setup lang="ts">
import { Address } from '@/core'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { SModal } from '@soramitsu-ui/ui'
import invariant from 'tiny-invariant'
import { KlayIconDownload } from '~klay-icons'
import { saveAs } from 'file-saver'

const props = defineProps<{
  address?: Address | null
}>()

const emit = defineEmits(['close'])

const showModel = computed({
  get: () => !!props.address,
  set: (v) => !v && emit('close'),
})

const qr = useQRCode(
  computed(() => props.address ?? ''),
  {
    width: 195,
    margin: 2,
    type: 'image/png',
  },
)

const { copy } = useClipboard()
const copyOk = refAutoReset(false, 1000)

async function copyAddress() {
  invariant(props.address)
  await copy(props.address)
  copyOk.value = true
}

async function download() {
  saveAs(await fetch(qr.value).then((x) => x.blob()), 'address.png')
}
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard class="w-344px">
      <template #title>
        <slot name="title" />
      </template>

      <div class="flex items-end space-x-6 justify-center">
        <img
          class="image-render-pixel -m-2"
          :src="qr"
          alt="QR Code"
        >

        <KlayButton
          type="action"
          @click="download"
        >
          <template #icon>
            <KlayIconDownload />
          </template>
        </KlayButton>
      </div>

      <hr class="klay-divider !my-4">

      <KlayButton
        class="w-full"
        @click="copyAddress"
      >
        <FormatAddress
          :value="address!"
          :length="12"
        />

        <template #icon>
          <IconCopyCheck :check="copyOk" />
        </template>
      </KlayButton>
    </KlayModalCard>
  </SModal>
</template>
