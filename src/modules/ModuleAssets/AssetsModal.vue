<script setup lang="ts">
import { useTokensSearchAndImport } from '@/utils/composable.tokens-search-and-import'
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import ListItem from './AssetsModalListItem.vue'

const assetsStore = useAssetsStore()
const { openAssetsModal: show, allTokens: tokens } = storeToRefs(assetsStore)

const tokensStore = useTokensStore()

const { notify } = useNotify()

const search = ref('')

const { tokensFiltered, isImportPending, tokenToImport, noResults } = useTokensSearchAndImport({
  tokens,
  search,
})

const showImportConfirmation = ref(false)

function doImport() {
  const token = tokenToImport.value
  invariant(token)
  tokensStore.importToken(token)
  search.value = ''
  notify({ type: 'ok', description: 'Token added' })
}

// const tokenToImport
</script>

<template>
  <SModal v-model:show="show">
    <ModalCardConfirmImportToken
      v-if="showImportConfirmation"
      :token="tokenToImport!"
      @confirm="doImport"
      @cancel="showImportConfirmation = false"
    />

    <KlayModalCard
      v-show="!showImportConfirmation"
      class="w-344px !max-h-640px"
    >
      <template #title>
        Add a token
      </template>

      <template #body>
        <div class="flex-1 min-h-0 flex flex-col">
          <div class="px-4 pb-4">
            <KlayTextField
              v-model="search"
              label="Search name or paste address"
            />
          </div>

          <hr class="klay-divider w-full">

          <div class="flex-1 overflow-y-scroll">
            <div v-if="noResults">
              No results
            </div>

            <template v-else-if="isImportPending || tokenToImport">
              <div v-if="isImportPending">
                <KlayLoader />
              </div>
              <ListItem
                v-else
                :token="tokenToImport"
                for-import
                @click:import="showImportConfirmation = true"
              />

              <hr class="klay-divider mx-4">
            </template>

            <template v-else>
              <template
                v-for="(x, i) in tokensFiltered"
                :key="x.address"
              >
                <hr
                  v-if="i > 0"
                  class="klay-divider mx-4"
                >

                <ListItem
                  :token="x"
                  :enabled="!assetsStore.hiddenAssets.has(x.address)"
                  @update:enabled="assetsStore.toggleHidden(x.address, $event)"
                />
              </template>
            </template>
          </div>

          <hr class="klay-divider w-full">

          <div class="p-4">
            <KlayButton @click="show = false">
              OK
            </KlayButton>
          </div>
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>
