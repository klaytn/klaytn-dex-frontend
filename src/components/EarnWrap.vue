<script setup lang="ts" name="EarnWrap">
const { t } = useI18n()
const vBem = useBemClass()

const menuActiveClass = 'earn-wrap__head-button--active'
</script>

<template>
  <div v-bem>
    <div v-bem="'head'">
      <slot name="head">
        <RouterLink
          v-bem="'head-button'"
          to="/farms"
          :active-class="menuActiveClass"
        >
          {{ t('earnWrap.menu.farms') }}
        </RouterLink>
        <RouterLink
          v-bem="'head-button'"
          to="/pools"
          :active-class="menuActiveClass"
        >
          {{ t('earnWrap.menu.pools') }}
        </RouterLink>
      </slot>
    </div>
    <slot />
  </div>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.earn-wrap
  background: linear-gradient(0deg, #ffffff, #ffffff), linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6)
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05)
  padding: 19px 16px
  border-radius: 20px
  overflow: visible
  margin: auto
  max-width: 1190px
  width: 100%

  &__head
    display: flex
    align-items: center
    justify-content: flex-start
    margin-bottom: 18px

    &-button
      font-style: normal
      font-weight: 700
      font-size: 18px
      line-height: 150%
      color: $gray3
      margin-right: 18px
      cursor: pointer

      &:last-child
        margin-right: 0

      &--active
        color: $dark
</style>
