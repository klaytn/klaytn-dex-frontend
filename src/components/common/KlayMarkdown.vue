<script setup lang="ts">
import { computed } from 'vue'
import { Remarkable } from 'remarkable'
import 'github-markdown-css/github-markdown-light.css'
import CONFIG from '~config'

const props = defineProps<{
  body: string
}>()

const remarkable = new Remarkable({
  html: false,
  breaks: true,
  typographer: false,
  linkTarget: '_blank',
})

const markdown = computed(() => {
  const body = props.body.replace(/!\[.*?\]\((ipfs:\/\/[a-zA-Z0-9]+?)\)/g, CONFIG.uriIPFS)
  return remarkable.render(body)
})
</script>

<template>
  <div
    class="markdown-body break-words"
    v-html="markdown"
  />
</template>
