<script setup lang="ts" name="ModuleStakingPool">
import { Token, Wei } from '@/core'
import BigNumber from 'bignumber.js'
import { SPopover } from '@soramitsu-ui/ui'

// FIXME use correct icon
import IconDotsVertical from '~icons/mdi/dots-vertical'

const props = defineProps<{
  token: Token
  usdPerToken: BigNumber
  balance: Wei
}>()

const { token } = toRefs(props)
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
      <span>
        <!-- TODO format -->
        ${{ usdPerToken.toString() }}
      </span>
    </div>

    <div class="two-line">
      <span>
        <!-- TODO format -->
        {{ balance.asBigInt }}
      </span>
      <span>
        <!-- TODO format -->
        $?
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
            <ModuleAssetsAssetsListItemMenuItem> Swap </ModuleAssetsAssetsListItemMenuItem>
            <ModuleAssetsAssetsListItemMenuItem> Receive </ModuleAssetsAssetsListItemMenuItem>
            <ModuleAssetsAssetsListItemMenuItem> Details </ModuleAssetsAssetsListItemMenuItem>
            <ModuleAssetsAssetsListItemMenuItem> Delete </ModuleAssetsAssetsListItemMenuItem>
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
