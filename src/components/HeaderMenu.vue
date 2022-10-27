<script setup lang="ts" name="HeaderMenu">
import { RouteName, HeaderMenuItem } from '@/types'
import { KlayIconArrowOutward } from '~klay-icons'

const props = defineProps<{
  items: HeaderMenuItem[]
}>()

const route = useRoute()

const itemsWithActive = computed(() =>
  props.items.map((x) => {
    return x.kind === 'route'
      ? {
          kind: 'route' as const,
          routeName: x.routeName,
          forceActive: x.activeWith?.includes(route.name as RouteName) ?? false,
          label: x.label,
          key: x.routeName,
        }
      : {
          kind: 'external' as const,
          href: x.href,
          label: x.label,
          key: x.href,
        }
  }),
)
</script>

<template>
  <div class="header-menu">
    <template
      v-for="item in itemsWithActive"
      :key="item.key"
    >
      <RouterLink
        v-if="item.kind === 'route'"
        :to="{ name: item.routeName }"
        active-class="active-item"
        :class="['header-item', { 'active-item': item.forceActive }]"
      >
        {{ item.label }}
      </RouterLink>

      <a
        v-else
        :href="item.href"
        class="header-item flex items-center space-x-2"
      >
        <span> {{ item.label }} </span>
        <KlayIconArrowOutward class="icon-link" />
      </a>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.header-menu {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: vars.$white;
  border-radius: 16px;
}

.header-item {
  font-style: normal;
  font-weight: 700;
  font-size: 12px;
  line-height: 150%;
  padding: 9px 12px;
  border-radius: 10px;
  color: vars.$dark;
}

.active-item {
  background: vars.$gray;
}

.icon-link {
  color: vars.$gray3;
}
</style>
