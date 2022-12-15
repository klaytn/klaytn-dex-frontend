<script setup lang="ts">
import { Token } from '@/core'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'

const props = defineProps<{
  token: Token
  enabled?: boolean
  forImport?: boolean
}>()

const emit = defineEmits(['update:enabled', 'click:import'])

const enabledModel = useVModel(props, 'enabled', emit)

const { lookupBalance, lookupDerivedUsd } = useMinimalTokensApi()

const balance = computed(() => {
  const wei = lookupBalance(props.token.address)
  return wei?.decimals(props.token) ?? null
})

const balanceUsd = computed(() => {
  const usd = lookupDerivedUsd(props.token.address)
  if (!usd || !balance.value) return null
  return balance.value.times(usd)
})
</script>

<template>
  <div class="px-4 py-3 flex items-center space-x-2">
    <KlayCharAvatar
      size="36"
      :symbol="token.symbol"
    />

    <div class="flex flex-col space-y-1 flex-1">
      <span :class="$style.lineTop">
        {{ token.symbol }}
      </span>
      <span
        v-if="!forImport"
        :class="$style.lineBottom"
      >
        <CurrencyFormat
          :amount="lookupDerivedUsd(token.address)"
          usd
        />
      </span>
    </div>

    <template v-if="!forImport">
      <div class="flex flex-col">
        <CurrencyFormatTruncate
          :class="$style.lineTop"
          :amount="balance"
          :symbol="token.symbol"
          max-width="80"
        />
        <div class="flex justify-end mt-1">
          <CurrencyFormatTruncate
            :amount="balanceUsd"
            usd
            :class="$style.lineBottom"
          />
        </div>
      </div>

      <KlaySwitch
        v-model="enabledModel"
        class="!-mr-2"
      />
    </template>

    <template v-else>
      <KlayButton
        size="sm"
        type="primary"
        @click="emit('click:import')"
      >
        Import
      </KlayButton>
    </template>
  </div>
</template>

<style module lang="scss">
@use '@/styles/vars';

.line-top {
  font-weight: 600;
  font-size: 16px;
}

.line-bottom {
  font-weight: 500;
  font-size: 14px;
  color: vars.$gray2;
}
</style>
