<script setup lang="ts">
import { Token } from '@/core'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'

const props = defineProps<{
  token: Token
  enabled?: boolean
}>()

const emit = defineEmits(['update:enabled'])

const enabledModel = useVModel(props, 'enabled', emit)

const { lookupBalance, lookupDerivedUsd } = useMinimalTokensApi()
</script>

<template>
  <div class="px-4 py-2 flex items-center">
    <KlayCharAvatar :symbol="token.symbol" />

    <div class="flex flex-col space-y-1 flex-1">
      <span>
        {{ token.symbol }}
      </span>
      <span>
        <CurrencyFormat
          :amount="lookupDerivedUsd(token.address)"
          decimals="2"
          usd
        />
      </span>
    </div>

    <div class="flex flex-col space-y-1">
      <span> balance </span>
      <span> and in usd </span>
    </div>

    <KlaySwitch
      v-model="enabledModel"
      class="-mr-2"
    />
  </div>
</template>
