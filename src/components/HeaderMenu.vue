<script setup lang="ts" name="HeaderMenu">
import { HeaderMenuItem, RouteName } from '@/types'
import { KlayIconArrowOutward, KlayIconCollapseArrow } from '~klay-icons'
import { SPopover } from '@soramitsu-ui/ui'

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

const activeItem = computed(() => {
  return (
    itemsWithActive.value.find((item) => item.forceActive) ||
    props.items.find((item) => item.kind === 'route' && item.routeName === route.name)
  )
})
</script>

<template>
  <SPopover
    placement="bottom"
    distance="8"
  >
    <template #trigger>
      <div
        :class="$style.trigger"
        class="md:hidden lt-md:flex items-center gap-1 rounded-lg p-2 bg-white text-xs font-bold"
      >
        {{ activeItem?.label ?? '' }}
        <KlayIconCollapseArrow :class="$style.triggerIcon" />
      </div>
    </template>

    <template #popper="{ show }">
      <div
        v-if="show"
        class="flex flex-col items-center bg-white z-10 rounded-lg shadow-lg p-4 w-96px"
      >
        <div :class="$style.arrowUp" />
        <template
          v-for="item in itemsWithActive"
          :key="item.key"
        >
          <RouterLink
            v-if="item.kind === 'route'"
            :to="{ name: item.routeName }"
            :active-class="$style.activeItem"
            :class="[$style.item, { [$style.activeItem]: item.forceActive }]"
          >
            {{ item.label }}
          </RouterLink>

          <a
            v-else
            :href="item.href"
            :class="$style.item"
            target="_blank"
            class="flex items-center space-x-2"
          >
            <span> {{ item.label }} </span>
            <KlayIconArrowOutward :class="$style.iconLink" />
          </a>
        </template>
      </div>
    </template>
  </SPopover>

  <div
    :class="$style.menu"
    class="lt-md:hidden md:flex items-center py-1 px-2 border-rd-4"
  >
    <template
      v-for="item in itemsWithActive"
      :key="item.key"
    >
      <RouterLink
        v-if="item.kind === 'route'"
        :to="{ name: item.routeName }"
        :active-class="$style.activeItem"
        :class="[$style.item, { [$style.activeItem]: item.forceActive }]"
      >
        {{ item.label }}
      </RouterLink>

      <a
        v-else
        :href="item.href"
        :class="$style.item"
        target="_blank"
        class="flex items-center space-x-2"
      >
        <span> {{ item.label }} </span>
        <KlayIconArrowOutward :class="$style.iconLink" />
      </a>
    </template>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.trigger:hover .trigger-icon {
  fill: vars.$blue;
}

.arrow-up {
  position: absolute;
  width: 0;
  height: 0;
  top: -6px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
}

.menu {
  background: vars.$white;
}

.item {
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
