<template>
  <CurrencyFormat v-slot="{ formatted }">
    <span
      :title="formatted || ''"
      class="max-w-40 truncate inline-block"
    >{{ formatted }}</span>
  </CurrencyFormat>
</template>
