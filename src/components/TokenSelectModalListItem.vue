<script setup lang="ts">
import { Token } from '@/core'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'

const props = defineProps<{
  token: Token
  disabled?: boolean
  forImport?: boolean
}>()

const emit = defineEmits(['click:import'])

const { lookupBalance } = useMinimalTokensApi()

const balanceAsToken = computed(() => lookupBalance(props.token.address)?.decimals(props.token) ?? null)
</script>

<template>
  <div
    class="item flex items-center px-4 py-3 space-x-2 cursor-pointer"
    :class="{ 'opacity-40 pointer-events-none': disabled }"
    data-testid="modal-list-item"
  >
    <KlayCharAvatar :symbol="token.symbol" />

    <div class="flex flex-1 flex-col space-y-[2px]">
      <div class="flex items-center justify-between">
        <span class="token-symbol">{{ token.symbol }}</span>
        <span
          v-if="!forImport"
          class="balance"
        >
          <CurrencyFormat
            :amount="balanceAsToken"
            :decimals="7"
          />
        </span>
      </div>
      <span class="token-name">{{ token.name }}</span>
    </div>

    <KlayButton
      v-if="forImport"
      type="primary"
      @click="emit('click:import')"
    >
      Import
    </KlayButton>
  </div>
</template>

<style lang="scss" scoped>
.item {
  &:hover {
    background: #eceff5;
  }
}

.token {
  &-symbol {
    font-size: 14px;
    font-weight: 600;
    // line-height: 17px;
    letter-spacing: 0em;
  }

  &-name {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0em;
    color: #778294;
  }
}

.balance {
  font-size: 14px;
  font-weight: 600;
}
</style>
