<script setup lang="ts" name="ModuleGovernanceListWrap">
import { Sorting } from '../types'
import CONFIG from '~config'

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

const createProposalHref = computed(() => {
  return `https://snapshot.org/#/${CONFIG.snapshotSpace}/create/0`
})
</script>

<template>
  <div v-bem>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mx-4 md:mx-6 py-4 md:h-74px">
      <div class="flex justify-end lt-md:w-full md:order-1">
        <a
          class="lt-md:hidden"
          target="_blank"
          :href="createProposalHref"
        >
          <KlayButton type="primary"> Create Proposal </KlayButton>
        </a>
        <a
          class="md:hidden"
          target="_blank"
          :href="createProposalHref"
        >
          <KlayButton
            type="primary"
            size="sm"
          > Create Proposal </KlayButton>
        </a>
      </div>
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
      <SearchFilter v-model="searchQuery" />
    </div>
    <slot />
  </div>
</template>

<style lang="sass">
@use '@/styles/vars'

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
