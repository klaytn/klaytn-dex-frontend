<script setup lang="ts">
import { Token, Wei } from '@/core/kaikas'
import { roundTo } from 'round-to'

const props = defineProps<{
  token: Token
  disabled?: boolean
  balance?: Wei
  forImport?: boolean
}>()

const emit = defineEmits(['click:import'])

const balanceFormatted = computed(() => {
  if (!props.balance) return null
  return roundTo(Number(props.balance.toToken(props.token)), 7)
})
</script>

<template>
  <div
    class="item flex items-center px-4 py-2 space-x-2 cursor-pointer"
    :class="{ 'opacity-40 pointer-events-none': disabled }"
  >
    <KlayCharAvatar :symbol="token.symbol" />

    <div class="flex flex-col space-y-1">
      <span class="token-symbol">{{ token.symbol }}</span>
      <span class="token-name">{{ token.name }}</span>
    </div>

    <div class="flex-1" />

    <KlayButton
      v-if="forImport"
      type="primary"
      @click="emit('click:import')"
    >
      Import
    </KlayButton>

    <span
      v-else
      class="balance"
    >
      <ValueOrDash :value="balanceFormatted" />
    </span>
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
</style>
