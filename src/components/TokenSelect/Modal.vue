<script lang="ts" setup>
import { Status, SModal } from '@soramitsu-ui/ui'
import { isAddress, Token, Address } from '@/core/kaikas'
import { useTask, useScope } from '@vue-kakuyaku/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'

const props = defineProps<{
  open: boolean
  selected: Address | null
}>()

const emit = defineEmits(['select', 'update:open'])

const openModel = useVModel(props, 'open', emit)

const tokensStore = useTokensStore()
const kaikasStore = useKaikasStore()

const { tokensWithBalance: tokens } = $(storeToRefs(tokensStore))

let search = $ref('')

const tokensFilteredBySearch = $computed(() => {
  const value = search
  const valueUpper = value.toUpperCase()
  return tokens?.filter((token) => token.symbol.includes(valueUpper) || token.address === value) ?? []
})

const recentTokens = $computed(() => tokensFilteredBySearch.slice(0, 6))

/**
 * it is ref, thus it is possible to reset it immediately,
 * not after debounce delay
 */
let searchAsAddress = $ref<null | Address>(null)
debouncedWatch(
  $$(search),
  (value) => {
    searchAsAddress = isAddress(value) ? value : null
  },
  { debounce: 500 },
)

const searchAsAddressSmartcontractCheckScope = useScope($$(searchAsAddress), (addr) => {
  const task = useTask(() => kaikasStore.getKaikasAnyway().isSmartContract(addr))
  useTaskLog(task, 'smartcontract-check-' + addr)
  task.run()
  return task
})

const importLookupScope = useScope(
  computed<false | Address>(() => {
    const addr = searchAsAddress
    const addrSmartcontractCheckState = searchAsAddressSmartcontractCheckScope.value?.setup.state
    if (
      addr &&
      addrSmartcontractCheckState?.kind === 'ok' &&
      addrSmartcontractCheckState.data &&
      !tokensStore.findTokenData(addr)
    )
      return addr
    return false
  }),
  (addr) => {
    const task = useTask<Token | null>(() => kaikasStore.getKaikasAnyway().getToken(addr))
    useTaskLog(task, 'import-lookup')
    task.run()
    return task
  },
)

const isImportLookupPending = $computed<boolean>(() => {
  return (
    importLookupScope.value?.setup.state.kind === 'pending' ||
    searchAsAddressSmartcontractCheckScope.value?.setup.state.kind === 'pending'
  )
})

const tokenToImport = $computed<Token | null>(() => {
  const state = importLookupScope.value?.setup.state
  return state?.kind === 'ok' ? state.data : null
})

const nothingFound = $computed(() => {
  if (tokensFilteredBySearch.length) return false
  // maybe importing something
  if (searchAsAddress && (tokenToImport || isImportLookupPending)) return false

  return true
})

function resetSearch() {
  search = ''
  searchAsAddress = null
}

function selectToken(token: Address) {
  emit('select', token)
}

function doImport() {
  invariant(tokenToImport)
  tokensStore.importToken(tokenToImport)
  resetSearch()
  $notify({ status: Status.Success, description: 'Token added' })
}
</script>

<template>
  <SModal v-model:show="openModel">
    <KlayModalCard
      style="width: 344px"
      no-padding
      title="Select a token"
      class="flex flex-col min-h-0 h-90vh overflow-hidden"
    >
      <template #body>
        <div class="flex-1 min-h-0 flex flex-col">
          <KlayTextField
            v-model="search"
            class="mx-[17px]"
            label="Search name or paste address"
          />

          <div class="p-2 flex items-center flex-wrap">
            <TagName
              v-for="t in recentTokens"
              :key="t.address"
              :disabled="t.address === selected"
              :label="t.symbol"
              class="m-2 cursor-pointer"
              @click="selectToken(t.address)"
            >
              <KlayCharAvatar :symbol="t.symbol" />
            </TagName>
          </div>

          <div class="flex-1 min-h-0 overflow-y-scroll list">
            <div class="h-full">
              <div
                v-if="nothingFound"
                class="p-4 text-center no-results"
              >
                No results found
              </div>

              <TokenSelectModalListItem
                v-else-if="tokenToImport"
                :token="tokenToImport"
                for-import
                @click:import="doImport()"
              />

              <div
                v-if="isImportLookupPending"
                class="p-8 flex items-center justify-center"
              >
                <KlayLoader />
              </div>

              <template
                v-for="(token, i) in tokensFilteredBySearch"
                :key="token.address"
              >
                <div
                  v-if="i > 0 || tokenToImport"
                  class="list-div mx-4"
                />

                <TokenSelectModalListItem
                  :token="token"
                  :disabled="token.address === selected"
                  :balance="token.balance"
                  class="py-2"
                  @click="selectToken(token.address)"
                />
              </template>
            </div>
          </div>
        </div>
      </template>
    </KlayModalCard>
  </SModal>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.list {
  border-top: 1px solid $gray5;
}

.list-div {
  border-top: 1px solid $gray5;
}
.no-results {
  color: rgba(49, 49, 49, 1);
  font-size: 14px;
}
</style>
