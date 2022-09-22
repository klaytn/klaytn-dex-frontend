<template>
  <div class="flex">
    <div class="flex-1 font-semibold text-sm">
      <slot name="title" />
    </div>

    <div class="flex flex-col">
      <slot name="value" />
    </div>
  </div>
</template>
