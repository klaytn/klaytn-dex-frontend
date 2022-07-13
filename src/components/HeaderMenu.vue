<script setup lang="ts" name="HeaderMenu">
import type { RouteName, HeaderMenuItem } from '@/types'

const props = defineProps<{
  items: HeaderMenuItem[]
}>()

const route = useRoute()

const computedItems = computed(() => {
  return props.items.map((item) => {
    const active = route.name === item.routeName || (item.activeWith ?? []).includes(route.name as RouteName)
    return {
      ...item,
      bemClass: ['item', { active }],
    }
  })
})

const vBem = useBemClass()
</script>

<template>
  <div v-bem>
    <router-link
      v-for="item in computedItems"
      :key="item.routeName"
      v-bem="item.bemClass"
      active-class=""
      :to="{ name: item.routeName }"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>

<style scoped lang="sass">
@import '@/styles/vars'

.header-menu
  display: flex
  align-items: center
  padding: 4px 8px
  background: $white
  border-radius: 16px
  &__item
    font-style: normal
    font-weight: 700
    font-size: 12px
    line-height: 150%
    padding: 9px 12px
    border-radius: 10px
    color: $dark
    &--active
      background: $gray
</style>
