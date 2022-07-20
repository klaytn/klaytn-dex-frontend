<script lang="ts" setup>
import { Token, Address, ValueWei, tokenWeiToRaw, asWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { roundTo } from 'round-to'

const props = withDefaults(
  defineProps<{
    token?: Address
    modelValue?: string
    isLoading?: boolean
    isDisabled?: boolean
    setByBalance?: boolean
    // FIXME not by design
    estimated?: boolean
  }>(),
  {
    isLoading: false,
    isDisabled: false,
    setByBalance: false,
    estimated: false,
  },
)

const emit = defineEmits(['update:modelValue', 'update:token'])

let model = $computed({
  get: () => {
    const value = props.modelValue
    if (!value) return ''
    const num = Number(props.modelValue)
    if (Number.isNaN(num)) return ''
    return roundTo(num, 5)
  },
  set: (v) => emit('update:modelValue', v),
})

// const addrFormatted = $computed(() => {
//   return props.token && formatAddress(props.token)
// })

const kaikasStore = useKaikasStore()
const { isConnected: isKaikasConnected } = $(storeToRefs(kaikasStore))

const tokensStore = useTokensStore()
const { isBalancePending } = $(storeToRefs(tokensStore))

const tokenData = $computed<null | Token>(() => (props.token && tokensStore.findTokenData(props.token)) ?? null)

const balance = $computed<null | ValueWei<BigNumber>>(
  () => (props.token && tokensStore.lookupUserBalance(props.token)) ?? null,
)
const balanceRaw = $computed(() => {
  if (!balance || !tokenData) return null
  return tokenWeiToRaw(tokenData, asWei(balance.toString()))
})
const balanceFormatted = $computed(() => {
  if (!balanceRaw) return '—'
  return roundTo(Number(balanceRaw), 5)
})

const showMaxButton = $computed(() => {
  return props.setByBalance && balance && props.modelValue !== balanceRaw
})

const tokenModel = useVModel(props, 'token', emit)

function setToMax() {
  invariant(balance)
  emit('update:modelValue', balanceRaw)
}

// const clipboard = useClipboard()
</script>

<template>
  <InputTokenTemplate
    v-model="model"
    :class="{ 'pointer-events-none': isLoading }"
    :input-disabled="isDisabled"
    :input-loading="isLoading"
    bottom
    :max-button="showMaxButton"
    @click:max="setToMax()"
  >
    <template #top-right>
      <TokenSelect v-model:token="tokenModel" />
    </template>

    <template #bottom-left>
      <span
        v-if="estimated"
        class="estimated"
      > estimated * </span>
    </template>

    <template #bottom-right>
      <div
        :title="balance?.toFixed()"
        class="balance flex items-center space-x-2"
      >
        <span>
          <template v-if="isKaikasConnected"> Balance: {{ balanceFormatted }} </template>
          <template v-else> Balance: Connect Wallet </template>
        </span>
        <KlayLoader
          v-if="isBalancePending"
          color="gray"
          size="14"
        />
        <IconKlayImportant />
      </div>
    </template>
  </InputTokenTemplate>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.balance {
  max-width: 200px;
}

.balance,
.estimated {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  color: #778294;
}
</style>
