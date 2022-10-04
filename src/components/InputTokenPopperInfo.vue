<script setup lang="ts">
import { Token, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'

const props = defineProps<{
  token: Token
  balance: WeiAsToken<BigNumber>
  derivedUsd?: BigNumber | null
}>()

const balanceAsUsd = computed(() => (props.derivedUsd ? props.derivedUsd.times(props.balance) : null))

const { copy } = useClipboard()
const copied = autoResetRef(false, 1000)

async function copyAddress() {
  await copy(props.token.address)
  copied.value = true
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-lg p-4 w-180px space-y-2">
    <div :class="$style.title">
      {{ token.name }} ({{ token.symbol }})
    </div>
    <div class="flex">
      <CurrencyFormatTruncate
        :amount="balance"
        :symbol="token.symbol"
        :class="$style.subtitle"
      />
    </div>
    <div class="flex">
      <CurrencyFormatTruncate
        usd
        :amount="balanceAsUsd"
        decimals="2"
        :class="$style.subtitle"
      />
    </div>
    <div
      class="flex items-center space-x-1"
      :class="$style.addr"
      @click="copyAddress"
    >
      <div class="flex-1 truncate">
        {{ token.address }}
      </div>
      <IconCopyCheck
        :check="copied"
        :class="$style.icon"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.title {
  font-weight: 700;
  font-size: 13px;
}

.subtitle,
.addr {
  font-weight: 500;
  font-size: 12px;
  line-height: 100%;
}

.addr {
  cursor: pointer;

  .icon {
    color: #adb9ce;
  }

  &:hover,
  &:hover .icon {
    color: vars.$blue;
  }
}
</style>
