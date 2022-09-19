<script setup lang="ts">
import { Token, Wei } from '@/core'
import BigNumber from 'bignumber.js'
import { SPopover } from '@soramitsu-ui/ui'

// FIXME use correct icon
import IconDotsVertical from '~icons/mdi/dots-vertical'

const props = defineProps<{
  token: Token
  derivedUsd?: BigNumber | null
  balance?: Wei | null
}>()

const emit = defineEmits(['goto-swap', 'open-details', 'hide'])

const balanceInUsd = computed(() => {
  const { balance, derivedUsd: usd } = props
  if (!balance || !usd) return null
  return usd.times(balance.decimals(props.token))
})

const balanceWithDecimals = computed(() => props.balance?.decimals(props.token))
</script>

<template>
  <div class="whole-item flex items-center px-4 py-3">
    <KlayCharAvatar
      :symbol="token.symbol"
      class="mr-2"
      size="36"
    />

    <div class="two-line flex-1">
      <span> {{ token.symbol }} </span>
      <span class="max-w-20 truncate">
        <CurrencyFormat
          :amount="derivedUsd"
          decimals="2"
          usd
        />
      </span>
    </div>

    <div class="two-line">
      <CurrencyFormat
        v-slot="{ formatted }"
        :amount="balanceWithDecimals"
        :symbol="token.symbol"
      >
        <span
          class="max-w-40 truncate"
          :title="formatted ?? ''"
        >
          <ValueOrDash :value="formatted" />
        </span>
      </CurrencyFormat>

      <span class="self-end max-w-30 truncate">
        <CurrencyFormat
          :amount="balanceInUsd"
          decimals="2"
          usd
        />
      </span>
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
            <ModuleAssetsAssetsListItemMenuItem @click="emit('goto-swap')">
              Swap
            </ModuleAssetsAssetsListItemMenuItem>
            <ModuleAssetsAssetsListItemMenuItem @click="emit('open-details')">
              Details
            </ModuleAssetsAssetsListItemMenuItem>
            <ModuleAssetsAssetsListItemMenuItem @click="emit('hide')">
              Hide
            </ModuleAssetsAssetsListItemMenuItem>
          </div>
        </template>
      </SPopover>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.whole-item {
  &:hover {
    background: vars.$gray7;
  }
}

.two-line {
  display: flex;
  flex-direction: column;

  & > :first-child {
    color: vars.$dark;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  & > :last-child {
    font-size: 14px;
    font-weight: 500;
    color: vars.$gray2;
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
