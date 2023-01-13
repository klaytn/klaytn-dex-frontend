<script lang="ts" setup>
import { SModal } from '@soramitsu-ui/ui'
import { Address, Token } from '@/core'
import invariant from 'tiny-invariant'
import { useTokensSearchAndImport } from '@/utils/composable.tokens-search-and-import'
import TokenSelectModalListItem from './TokenSelectModalListItem.vue'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'

const props = defineProps<{
  show: boolean
  selected: Set<Address>
  unknownSelectedAddress?: Address | null
  tokensImportedAddresses: Address[]
  tokensWhitelist: Token[]
  areImportedTokensPending?: boolean
}>()

interface Emits {
  (event: 'close' | 'drop-unknown-selection'): void
  (event: 'select', token: Address): void
  (event: 'import-token', token: Token): void
}

const emit = defineEmits<Emits>()

const showModel = computed({
  get: () => props.show,
  set: (v) => !v && emit('close'),
})

const { lookupToken } = useMinimalTokensApi()

const lookupTokensAssertive = (items: Address[]): Token[] =>
  items.map((x) => {
    const token = lookupToken(x)
    invariant(token)
    return token
  })

const tokens = computed((): Token[] => {
  const whitelist = props.tokensWhitelist
  if (props.areImportedTokensPending) return whitelist
  return [...lookupTokensAssertive(props.tokensImportedAddresses), ...whitelist]
})

const selectedSetWithLowerAddresses = computed(() => new Set([...props.selected].map((x) => x.toLowerCase())))

function isSelected(addr: Address): boolean {
  return selectedSetWithLowerAddresses.value.has(addr.toLowerCase()) ?? false
}

const { notify } = useNotify()

const search = ref('')

const searchOrUnknownAddr = computed({
  get: () => props.unknownSelectedAddress ?? search.value,
  set: (v) => {
    if (props.unknownSelectedAddress) emit('drop-unknown-selection')
    search.value = v
  },
})

const { debounced: searchDebounced } = refAndDebounced(searchOrUnknownAddr, 500)

const { tokensFiltered, isImportPending, noResults, tokenToImport } = useTokensSearchAndImport({
  tokens,
  search: searchOrUnknownAddr,
})

const recentTokens = computed(() => tokens.value.slice(0, 6) ?? null)

function resetSearch() {
  search.value = ''
}

function selectToken(token: Address) {
  emit('select', token)
}

function doImport() {
  invariant(tokenToImport.value)
  emit('import-token', tokenToImport.value)
  resetSearch()
  notify({ type: 'ok', description: 'Token added' })
}
</script>

<template>
  <SModal v-model:show="showModel">
    <KlayModalCard
      no-padding
      title="Select a token"
      class="w-344px h-640px flex flex-col min-h-0 max-h-90vh overflow-hidden"
    >
      <template #body>
        <div class="flex-1 min-h-0 flex flex-col">
          <KlayTextField
            v-model="searchDebounced"
            class="mx-[17px]"
            label="Search name or paste address"
            data-testid="modal-search"
          />

          <div class="p-2 flex items-center flex-wrap">
            <TagName
              v-for="t in recentTokens"
              :key="t.address"
              :disabled="isSelected(t.address)"
              :label="t.symbol"
              class="m-2 cursor-pointer"
              data-testid="modal-recent-token"
              @click="selectToken(t.address)"
            >
              <KlayCharAvatar :symbol="t.symbol" />
            </TagName>
          </div>

          <hr class="klay-divider">

          <div class="flex-1 min-h-0 overflow-y-scroll">
            <div class="h-full">
              <div
                v-if="noResults"
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
                v-if="isImportPending || areImportedTokensPending"
                class="p-8 flex items-center justify-center"
                data-testid="modal-imported-loader"
              >
                <KlayLoader />
              </div>

              <template
                v-for="(token, i) in tokensFiltered"
                :key="token.address"
              >
                <hr
                  v-if="i > 0 || tokenToImport"
                  class="klay-divider mx-4"
                >

                <TokenSelectModalListItem
                  :token="token"
                  :disabled="isSelected(token.address)"
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
@use '@/styles/vars';

.no-results {
  color: vars.$dark2;
  font-size: 14px;
}
</style>
