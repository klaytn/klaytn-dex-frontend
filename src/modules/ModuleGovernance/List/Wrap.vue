<script setup lang="ts" name="ModuleGovernanceListWrap">
import { Sorting } from '../types'

const { t } = useI18n()
const vBem = useBemClass()

const governanceStore = useGovernanceStore()
const { onlyActive, searchQuery, sorting } = toRefs(governanceStore)

const sortingOptions = computed(() => {
  return Object.values(Sorting).map((option) => ({
    value: option,
    label: t(`ModuleGovernanceWrap.sorting.options.${option}`),
  }))
})
</script>

<template>
  <div v-bem>
    <div class="flex flex-wrap items-center gap-3 mx-4 md:mx-6 py-4 md:h-[74px]">
      <KlaySwitch
        v-model="onlyActive"
        v-bem="'only-active'"
        label="Only active"
      />
      <SortingFilter
        v-model="sorting"
        class="ml-auto"
        :options="sortingOptions"
      />
      <SearchFilter
        v-model="searchQuery"
        class="ml-2"
      />
    </div>
    <slot />
  </div>
</template>

<style lang="sass">
@use '@/styles/vars.sass'

.module-governance-list-wrap
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
  &__only-active
    .s-switch__label
      margin-left: 10px
      font-weight: 700
      font-size: 14px
</style>
