<script setup lang="ts" name="NotificationsInit">
import { useNotifications } from '@soramitsu-ui/ui'

const { show } = useNotifications()

window.$notify = show
</script>

<template>
  <div />
</template>
