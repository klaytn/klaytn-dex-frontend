<script lang="ts" setup>
import { Status, SModal } from '@soramitsu-ui/ui'
import { isAddress, Token, Address } from '@/core/kaikas'
import invariant from 'tiny-invariant'
import { TokenWithOptionBalance } from '@/store/tokens'

const props = defineProps<{
  open: boolean
  selected: Address | null
  tokens: TokenWithOptionBalance[]
  isSmartContract: (addr: Address) => Promise<boolean>
  getToken: (addr: Address) => Promise<Token>
  lookupToken: (addr: Address) => null | Token
}>()

const emit = defineEmits(['select', 'update:open', 'import-token'])

const openModel = useVModel(props, 'open', emit)

const tokens = $toRef(props, 'tokens')

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
let searchAsAddress = $computed<null | Address>(() => (isAddress(search) ? search : null))

const searchAsAddressSmartcontractCheckScope = useParamScope($$(searchAsAddress), (addr) => {
  const { state } = useTask(() => props.isSmartContract(addr), { immediate: true })
  usePromiseLog(state, 'smartcontract-check-' + addr)
  return state
})

const importLookupScope = useParamScope(
  computed(() => {
    const addr = searchAsAddress
    const addrSmartcontractCheckState = searchAsAddressSmartcontractCheckScope.value?.expose
    if (addr && addrSmartcontractCheckState?.fulfilled?.value && !props.lookupToken(addr)) return addr
    return null
  }),
  (addr) => {
    const { state } = useTask(() => props.getToken(addr), { immediate: true })
    usePromiseLog(state, 'import-lookup')
    return state
  },
)

const isImportLookupPending = $computed<boolean>(
  () => !!importLookupScope.value?.expose.pending || !!searchAsAddressSmartcontractCheckScope.value?.expose.pending,
)

const tokenToImport = $computed<Token | null>(() => importLookupScope.value?.expose.fulfilled?.value ?? null)

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
  emit('import-token', tokenToImport)
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
