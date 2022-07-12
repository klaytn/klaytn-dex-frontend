<script lang="ts" setup>
import { Status, SModal } from '@soramitsu-ui/ui'
import { Balance, isAddress, Token, Address, tokenWeiToRaw } from '@/core/kaikas'
import { useTask, useScope } from '@vue-kakuyaku/core'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'

const props = defineProps<{
  open: boolean
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
  task.run()
  return task
})

const tokenToImportScope = useScope(
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
    task.run()
    return task
  },
)

const tokenToImport = $computed<Token | null>(() => {
  const state = tokenToImportScope.value?.setup.state
  return state?.kind === 'ok' ? state.data : null
})

function isBalancePositive(balance: Balance<BigNumber>): boolean {
  return new BigNumber(balance).isGreaterThan(0)
}

function formatBalance(balance: Balance<BigNumber>, decimals: number): string {
  const raw = tokenWeiToRaw({ decimals }, balance.toString() as Balance<string>)
  return new BigNumber(raw).toFixed(4)
}

function resetSearch() {
  search = ''
  searchAsAddress = null
}

function selectToken(token: Address) {
  // const balance = tokensStore.userBalanceMap?.get(token)
  // invariant(balance, 'Balance should be loaded before selection')
  // invariant(isBalancePositive(balance), 'Balance should be greater than 0')
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
      title="Select a token"
      class="flex flex-col min-h-0 pt-5 h-90vh"
    >
      <div class="flex-1 pt-4 h-full min-h-0 flex flex-col">
        <KlayTextField
          v-model="search"
          class="mx-[17px]"
          label="Search name or paste address"
        />

        <div class="p-x-[17px] recent">
          <div
            v-for="t in recentTokens"
            :key="t.address"
            class="tag"
            @click="selectToken(t.address)"
          >
            <TagName
              :key="t.symbol"
              :label="t.symbol"
            >
              <KlayCharAvatar :content="t.symbol" />
            </TagName>
          </div>
        </div>

        <div class="flex-1 overflow-y-scroll list mb-2">
          <div
            v-if="tokenToImport"
            class="list-item"
            @click="doImport()"
          >
            <KlayCharAvatar :content="tokenToImport.symbol" />
            <div class="info">
              <p class="token">
                {{ tokenToImport.symbol }}
              </p>
              <span class="token-name">{{ tokenToImport.name }}</span>
            </div>
            <button
              type="button"
              class="import"
            >
              Import
            </button>
          </div>

          <template
            v-for="t in tokensFilteredBySearch"
            :key="t.address"
          >
            <div class="list-hr" />

            <div
              class="list-item"
              @click="selectToken(t.address)"
            >
              <KlayCharAvatar :content="t.symbol" />
              <div class="info">
                <p class="token">
                  {{ t.symbol }}
                </p>
                <span class="token-name">{{ t.name.toLowerCase() }}</span>
              </div>
              <div
                :title="`${t.balance ?? '-'} ${t.symbol}`"
                class="token-count"
              >
                {{ t.balance ? formatBalance(t.balance, t.decimals) : '-' }} {{ t.symbol }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </KlayModalCard>
  </SModal>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

p {
  color: $gray4;
  font-weight: 500;
  font-size: 12px;
  line-height: 180%;
}

.recent {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 16px;
}

.tag {
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.list {
  margin-top: 17px;
  max-height: 400px;
  border-top: 1px solid $gray5;
}

.list-hr {
  background: $gray5;
  height: 1px;
  min-height: 1px;
  margin: 0 17px;
  // width: 100%;
}

.list-item {
  display: flex;
  align-items: flex-start;

  padding: 8px 17px;
  cursor: pointer;

  &_disabled {
    opacity: 0.5 !important;
    cursor: default !important;

    &:hover {
      background: $white !important;
    }
  }

  &:hover {
    background: $gray3;
  }

  &:last-child {
    border-bottom: 1px solid $gray5;
  }
}

.info {
  margin-left: 5px;
}

.token {
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: $dark;
}

.token-name {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 180%;
  color: $gray4;
}

.token-logo {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
}

.token-count {
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: $dark;
  margin-left: auto;
  max-width: 150px;
}

.import {
  background: $blue;
  border-radius: 10px;
  color: $white;
  margin-left: auto;
  font-weight: 700;
  font-size: 12px;
  line-height: 18px;
  padding: 7px 24px;
  cursor: pointer;
}
</style>
