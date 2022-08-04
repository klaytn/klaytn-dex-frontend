<script setup lang="ts" name="VotingProposal">
const route = useRoute()
</script>

<template>
  <ModuleGovernanceProposal :id="route.params.id" />
</template>

<route lang="yaml">
name: VotingProposal
</route>
