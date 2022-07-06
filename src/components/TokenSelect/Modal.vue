<script lang="ts" setup>
import { Status } from '@soramitsu-ui/ui'
import { Balance, isAddress, Token, Address, tokenWeiToRaw } from '@/core/kaikas'
import { useTask, useScope } from '@vue-kakuyaku/core'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'

const emit = defineEmits(['close', 'select'])

const tokensStore = useTokensStore()
const kaikasStore = useKaikasStore()

const { tokensWithBalance: tokens } = $(storeToRefs(tokensStore))

let search = $ref('')

const tokensFilteredBySearch = $computed(() => {
  const value = search
  const valueUpper = value.toUpperCase()
  return tokens?.filter((token) => token.symbol.includes(valueUpper) || token.address === value) ?? []
})

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
      !tokensStore.tryFindToken(addr)
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

function isBalancePositive(balance: Balance): boolean {
  return new BigNumber(balance).isGreaterThan(0)
}

function formatBalance(balance: Balance, decimals: number): string {
  const raw = tokenWeiToRaw({ decimals }, balance)
  return new BigNumber(raw).toFixed(4)
}

function selectToken(token: Address) {
  const balance = tokensStore.userBalanceMap?.get(token)
  invariant(balance, 'Balance should be loaded before selection')
  invariant(isBalancePositive(balance), 'Balance should be greater than 0')
  emit('select', token)
}

function doImport() {
  invariant(tokenToImport)
  tokensStore.importToken(tokenToImport)
  search = ''
  searchAsAddress = null
  $notify({ status: Status.Success, description: 'Token added' })
}
</script>

<template>
  <KlayModal
    padding="20px 0"
    width="344"
    label="Select a token"
    @close="emit('close')"
  >
    <div class="row">
      <div class="token-select-modal">
        <div class="token-select-modal--input">
          <p>Search name or paste address</p>
          <input
            v-model="search"
            type="text"
            placeholder="KLAY"
          >
        </div>
      </div>
    </div>

    <div class="token-select-modal--recent row">
      <div
        v-for="t in tokensFilteredBySearch.slice(0, 6)"
        :key="t.address"
        class="token-select-modal--tag"
        @click="selectToken(t.address)"
      >
        <TagName
          :key="t.symbol"
          :label="t.symbol"
        >
          <KlayIcon
            :char="t.symbol[0]"
            name="empty-token"
          />
          <!--          <img class="token-logo" :src="t.logo" alt="token logo" /> -->
        </TagName>
      </div>
    </div>

    <div class="token-select-modal--list">
      <div
        v-if="tokenToImport"
        class="token-select-modal--item"
        @click="doImport()"
      >
        <KlayIcon
          :char="tokenToImport.symbol[0]"
          name="empty-token"
        />
        <div class="info">
          <p class="token">
            {{ tokenToImport.symbol }}
          </p>
          <span class="token-name">{{ tokenToImport.name }}</span>
        </div>
        <button
          type="button"
          class="token-select-modal--import"
        >
          Import
        </button>
      </div>

      <div
        v-for="t in tokensFilteredBySearch"
        :key="t.address"
        class="token-select-modal--item"
        :class="{ 'token-select-modal--item-disabled': t.balance && !isBalancePositive(t.balance) }"
        @click="selectToken(t.address)"
      >
        <KlayIcon
          :char="t.symbol[0]"
          name="empty-token"
        />
        <div class="info">
          <p class="token">
            {{ t.symbol }}
          </p>
          <span class="token-name">{{ t.name.toLowerCase() }}</span>
        </div>
        <KlayTextField
          :title="`${t.balance ?? '-'} ${t.symbol}`"
          class="token-count"
        >
          {{ t.balance ? formatBalance(t.balance, t.decimals) : '-' }} {{ t.symbol }}
        </KlayTextField>
      </div>
    </div>
  </KlayModal>
</template>

<style scoped lang="scss">
.row {
  padding: 0 17px;
}

.token-select-modal {
  margin-top: 17px;
  width: 100%;
  background: $gray3;
  border-radius: 8px;
  padding: 10px 16px;

  & p {
    color: $gray4;
    font-weight: 500;
    font-size: 12px;
    line-height: 180%;
  }

  & input {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 180%;
    color: $dark;
    background: none;
    border: none;
    width: 100%;
  }

  &--recent {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  &--tag {
    margin-right: 8px;
    margin-bottom: 8px;
    cursor: pointer;
  }

  &--list {
    margin-top: 17px;
    max-height: 400px;
  }

  &--item {
    display: flex;
    align-items: flex-start;
    padding: 8px 17px;
    border-top: 1px solid $gray5;
    cursor: pointer;

    &-disabled {
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

    & .info {
      margin-left: 5px;
    }

    & .token {
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 17px;
      color: $dark;
    }

    & .token-name {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 180%;
      color: $gray4;
    }

    & .token-logo {
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
  }

  &--import {
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
}
</style>
