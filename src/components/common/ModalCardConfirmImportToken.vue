<script setup lang="ts">
import { Token, Wei, makeExplorerLinkToAccount } from '@/core'
import BigNumber from 'bignumber.js'
import MaterialSymbolsErrorRounded from '~icons/material-symbols/error-rounded'

const props = defineProps<{
  token: Token
  balance?: Wei | null
  derivedUsd?: BigNumber | null
}>()

const emit = defineEmits(['confirm', 'cancel'])

const understandCheck = ref(false)

const explorerLink = computed(() => makeExplorerLinkToAccount(props.token.address))

const balanceAsToken = computed(() => props.balance?.decimals(props.token))

const balanceInUsd = computed(() => {
  const balance = balanceAsToken.value
  const derivedUsd = props.derivedUsd
  return balance && derivedUsd && balance.times(derivedUsd)
})
</script>

<template>
  <KlayModalCard
    back-arrow
    class="w-344px"
    @click:back="emit('cancel')"
  >
    <template #title>
      Import Asset
    </template>

    <div class="space-y-4">
      <div class="flex space-x-2">
        <KlayCharAvatar
          size="36"
          :symbol="token.symbol"
        />

        <div class="flex-1 flex flex-col space-y-2">
          <span :class="$style.title1">{{ token.symbol }}</span>
          <span :class="$style.title2">{{ token.name }}</span>
          <span :class="$style.title2">
            <FormatAddress
              :value="token.address"
              :length="6"
            />
          </span>
          <KlayExternalLink
            :href="explorerLink"
            :class="$style.title2"
          >
            Explorer
          </KlayExternalLink>
        </div>

        <div
          v-if="balanceAsToken"
          class="flex flex-col space-y-1"
        >
          <CurrencyFormatTruncate
            :class="$style.title1"
            :amount="balanceAsToken"
            max-width="100"
          />

          <div class="flex justify-end">
            <CurrencyFormatTruncate
              v-if="balanceInUsd"
              :class="$style.title2"
              :amount="balanceInUsd"
              usd
              max-width="100"
            />
          </div>
        </div>
      </div>

      <div
        :class="$style.warningWrap"
        class="p-4 space-y-2 rounded-lg"
      >
        <div class="flex items-center space-x-1">
          <MaterialSymbolsErrorRounded :class="$style.warningIcon" />
          <span :class="$style.warningTitle">Trade at your own risk!</span>
        </div>
        <div :class="$style.warningText">
          Anyone can create a token on {{ token.symbol }} with any name, including creating fake versions of existing
          tokens and tokens that claim to represent projects that do not have a token. If you purchase an arbitrary
          token, you may be unable to sell it back.
        </div>
      </div>

      <div class="flex items-center justify-between">
        <KlayCheckBox
          id="understand-check"
          v-model="understandCheck"
        >
          I understand
        </KlayCheckBox>

        <KlayButton
          :disabled="!understandCheck"
          @click="emit('confirm')"
        >
          Import asset
        </KlayButton>
      </div>
    </div>
  </KlayModalCard>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.title-1 {
  font-weight: 600;
  font-size: 16px;
}

.title-2 {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;
}

.warning-wrap {
  border: 1px solid vars.$gray5;
}

.warning-icon {
  color: vars.$orange;
}

.warning-title {
  font-weight: 600;
  font-size: 14px;
}

.warning-text {
  font-weight: 400;
  font-size: 12px;
  line-height: 180%;
  color: vars.$dark2;
}
</style>
