<script setup lang="ts" name="EarnWrap">
import { SSwitch, SSelect, STextField } from '@soramitsu-ui/ui'

import { Sorting } from '@/modules/FarmingModule/types'

const { t } = useI18n()
const vBem = useBemClass()

const farmingStore = useFarmingStore()
const { stakedOnly, searchQuery, sorting } = toRefs(farmingStore)

const sortingOptions = computed(() => {
  return Object.values(Sorting).map(option => ({
    value: option,
    label: t(`EarnWrap.sorting.options.${option}`)
  }))
})

const menuActiveClass = 'earn-wrap__head-button--active'
</script>

<template>
  <div v-bem>
    <div v-bem="'head'">
      <RouterLink
        v-bem="'head-button'"
        to="/farms"
        :active-class="menuActiveClass"
      >
        {{ t('EarnWrap.menu.farms') }}
      </RouterLink>
      <RouterLink
        v-bem="'head-button'"
        to="/pools"
        :active-class="menuActiveClass"
      >
        {{ t('EarnWrap.menu.pools') }}
      </RouterLink>
      <SSwitch
        v-model="stakedOnly"
        v-bem="'staked-only'"
        label="Staked only"
      />
      <span v-bem="'sorting-label'">
        {{ t('EarnWrap.sorting.label') }}
      </span>
      <SSelect
        v-model="sorting"
        v-bem="'sorting'"
        :options="sortingOptions"
        size="lg"
      />
      <STextField
        v-model="searchQuery"
        v-bem="'search'"
        label="Search"
      >
        <template #append>
          <KlayIcon
            v-bem="'search-icon'"
            name="search"
          />
        </template>
      </STextField>
    </div>
    <slot />
  </div>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.earn-wrap
  display: flex
  flex-direction: column
  border-radius: 20px
  overflow: visible
  margin: auto
  max-width: 1190px
  width: 100%
  min-height: calc(100vh - 204px)
  background: linear-gradient(0deg, #ffffff, #ffffff), linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6)
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05)
  &__head
    display: flex
    align-items: center
    justify-content: flex-start
    height: 74px
    padding: 0 16px 0 30px
    &-button
      font-style: normal
      font-weight: 700
      font-size: 18px
      line-height: 150%
      color: $gray3
      cursor: pointer
      & + &
        margin-left: 16px
      &:last-child
        margin-right: 0
      &--active
        color: $dark
  &__staked-only
    margin-left: 32px
    .s-switch__label
      margin-left: 10px
      font-weight: 700
      font-size: 14px
  &__sorting
    margin-left: 8px
    &-label
      margin-left: auto
      font-size: 14px
      font-weight: 400
      color: $gray2
    div:last-child
      z-index: 100
    .s-radio-atom_checked
      border-color: $blue !important
      &:before
        background-color: $blue !important
    .s-select-input__label
      display: none
      + span
        font-weight: 500
        font-size: 14px
    &, .s-select-dropdown
      width: 160px
  &__search
    width: 160px
    margin-left: 16px
    &, .s-text-field__input-wrapper
      height: 40px
    label
      transform: translateY(0)
      top: 12px
      left: 38px
      line-height: 16px
      color: $gray2
    &:focus-within label
      transform: translateY(0)
      opacity: 0
    input
      padding: 12px 12px 12px 38px
      line-height: 16px
    &-icon
      position: absolute
      left: 12px
      stroke: $gray2
</style>
