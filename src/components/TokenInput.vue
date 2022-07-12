<script lang="ts" setup>
import { formatAddress, Token, Address, ValueWei, tokenRawToWei, tokenWeiToRaw, asWei } from '@/core/kaikas'
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
  }>(),
  {
    isLoading: false,
    isDisabled: false,
    setByBalance: false,
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

const tokenData = $computed<null | Token>(
  () => (props.token && tokensStore.tokens?.find((x) => x.address === props.token)) ?? null,
)

const balance = $computed<null | ValueWei<BigNumber>>(
  () => (props.token && tokensStore.userBalanceMap?.get(props.token)) ?? null,
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
  <div
    class="root space-y-2"
    :class="{ 'pointer-events-none': isLoading }"
  >
    <div class="flex items-center space-x-2">
      <div class="flex-1">
        <KlayLoader
          v-if="isLoading"
          color="gray"
        />

        <input
          v-else-if="token"
          v-bind="$attrs"
          v-model="model"
          :disabled="isDisabled"
          placeholder="0"
        >
      </div>

      <KlayButton
        v-if="showMaxButton"
        size="xs"
        type="primary"
        @click="setToMax()"
      >
        MAX
      </KlayButton>

      <div class="select-wrap">
        <TokenSelect v-model:token="tokenModel" />
      </div>
    </div>

    <div class="flex">
      <div class="flex-1" />

      <div
        :title="balance?.toFixed()"
        class="balance flex space-x-2"
      >
        <span>
          <template v-if="isKaikasConnected"> Balance: {{ balanceFormatted }} </template>
          <template v-else> Balance: Connect Wallet </template>
        </span>
        <IconKlayImportant />
      </div>

      <!-- <div
          v-if="tokenData"
          class="token-info"
        >
          <p>{{ tokenData.name }} {{ `(${tokenData.symbol})` }}</p>
          <span class="price"> - </span>
          <span class="percent">0.26%</span>

          <div
            class="address"
            @click="clipboard.copy(token!)"
          >
            <span class="address-name">{{ addrFormatted }}</span>
            <IconKlayCopy />
          </div>
        </div>
      </div> -->
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.root {
  background: $gray6;
  padding: 16px 16px;
  border-radius: 8px;

  &--loading {
    opacity: 0.4;
  }
}

input {
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 130%;
  color: $dark2;
  background: transparent;
  border: none;
  min-width: 0;
  width: 100%;

  &:focus {
    outline: none;
  }
}

button.max {
  font-weight: 700;
  font-size: 10px;
  line-height: 16px;
  background: $blue;
  border-radius: 8px;
  color: $white;
  padding: 4px 8px;
  cursor: pointer;
}

.balance {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  color: $gray4;
  max-width: 200px;
}
</style>
