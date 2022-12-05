<script setup lang="ts">
import { Token } from '@/core'
import { SPopover } from '@soramitsu-ui/ui'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import MenuItem from './AssetsListItemMenuItem.vue'

// FIXME use correct icon
import IconDotsVertical from '~icons/mdi/dots-vertical'

const props = defineProps<{
  token: Token
}>()

const { lookupBalance, lookupDerivedUsd } = useMinimalTokensApi()

const balance = computed(() => lookupBalance(props.token.address))
const derivedUsd = computed(() => lookupDerivedUsd(props.token.address))

const emit = defineEmits(['goto-swap', 'hide'])

const balanceInUsd = computed(() => {
  const balanceValue = balance.value
  const usd = derivedUsd.value
  if (!balanceValue || !usd) return null
  return usd.times(balanceValue.decimals(props.token))
})

const balanceWithDecimals = computed(() => balance.value?.decimals(props.token))
</script>

<template>
  <div class="flex items-center px-4 py-3">
    <KlayCharAvatar
      :symbol="token.symbol"
      class="mr-2"
      size="36"
    />

    <div class="flex-1 flex gap-4 min-w-0">
      <div class="two-line flex-1">
        <span> {{ token.symbol }} </span>
        <span class="amount">
          <CurrencyFormatTruncate
            :amount="derivedUsd"
            usd
            max-width="50"
          />
        </span>
      </div>

      <div class="two-line flex-2 items-end min-w-0">
        <CurrencyFormatTruncate
          :amount="balanceWithDecimals"
          :symbol="token.symbol"
          max-width="auto"
        />
        <span class="amount self-end max-w-30">
          <CurrencyFormatTruncate
            :amount="balanceInUsd"
            usd
          />
        </span>
      </div>
    </div>

    <div>
      <SPopover placement="bottom">
        <template #trigger>
          <span>
            <IconDotsVertical class="icon-dots" />
          </span>
        </template>

        <template #popper="{ show }">
          <div
            v-if="show"
            class="rounded-lg bg-white shadow-lg py-2"
          >
            <MenuItem @click="emit('goto-swap')">
              Swap
            </MenuItem>
            <MenuItem @click="emit('hide')">
              Hide
            </MenuItem>
          </div>
        </template>
      </SPopover>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.two-line {
  display: flex;
  flex-direction: column;

  & > :first-child {
    color: vars.$dark;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .amount {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: vars.$gray2 !important;
  }
}

.icon-dots {
  font-size: 30px;
  color: vars.$dark;
  cursor: pointer;

  &:hover {
    color: vars.$blue;
  }
}
</style>
