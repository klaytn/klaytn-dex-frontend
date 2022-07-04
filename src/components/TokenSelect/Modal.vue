<script lang="ts" setup>
import { Status } from '@soramitsu-ui/ui'
import { type Balance, isAddress, Token, Address, fromWei } from '@/core/kaikas'
import { useTask, useScope } from '@vue-kakuyaku/core'
import { type KIP7 } from '@/types/typechain/tokens'
import { KIP7 as KIP7_ABI } from '@/core/kaikas/smartcontracts/abi'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'

const emit = defineEmits<(...args: [event: 'close'] | [event: 'select', value: Token]) => void>()

const tokensStore = useTokensStore()
const { tokensList } = $(storeToRefs(tokensStore))

const kaikasStore = useKaikasStore()

let search = $ref('')

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

const importTokenScope = useScope($$(searchAsAddress), (addr) => {
  const createImportTokenTask = useTask<Token | null>(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()

    const code = await kaikas.cfg.caver.klay.getCode(addr)
    const doesExist = tokensList.find(({ address }) => address === addr)

    if (code === '0x' || doesExist) {
      return null
    }

    const contract = kaikas.cfg.createContract<KIP7>(addr, KIP7_ABI)
    const symbol = await contract.methods.symbol().call()
    const name = await contract.methods.name().call()

    // FIXME why the balance here is the balance of the user?
    // compare with `Kaikas.createToken()` - it uses the token address
    const balance = (await contract.methods.balanceOf(kaikas.selfAddress).call()) as Balance

    return {
      address: addr,
      name,
      symbol,
      balance,
      // logo: '-',
      // slug: '-',
    }
  })

  createImportTokenTask.run()

  return createImportTokenTask
})

const importToken = $computed<Token | null>(() => {
  const state = importTokenScope.value?.setup.state
  return state?.kind === 'ok' ? state.data : null
})

const renderTokens = $computed<Token[]>(() => {
  const value = search
  const valueUpper = value.toUpperCase()

  return tokensList.filter((token) => token.symbol.includes(valueUpper) || token.address === value)
})

/**
 * FIXME why slice? why 6 elems?
 */
const renderTokensSlice = $computed(() => renderTokens.slice(0, 6))

function getRenderBalance(balance: Balance): string {
  const value = new BigNumber(fromWei(balance))
  return value.toFixed(4)
}

function onSelect(token: Token) {
  if (Number(token.balance) <= 0) return
  emit('select', token)
}

function onAddToken() {
  if (importToken) {
    tokensList.unshift(importToken)

    search = ''
    searchAsAddress = null

    $notify({ status: Status.Success, description: 'Token added' })
  }
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
        v-for="t in renderTokensSlice"
        :key="t.address"
        class="token-select-modal--tag"
        @click="onSelect(t)"
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
        v-if="importToken"
        class="token-select-modal--item"
        @click="onAddToken"
      >
        <KlayIcon
          :char="importToken.symbol[0]"
          name="empty-token"
        />
        <div class="info">
          <p class="token">
            {{ importToken.symbol }}
          </p>
          <span class="token-name">{{ importToken.name }}</span>
        </div>
        <button
          type="button"
          class="token-select-modal--import"
        >
          Import
        </button>
      </div>

      <div
        v-for="t in renderTokens"
        :key="t.address"
        class="token-select-modal--item"
        :class="{ 'token-select-modal--item-disabled': Number(t.balance) <= 0 }"
        @click="onSelect(t)"
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
          :title="`${t.balance} ${t.symbol}`"
          class="token-count"
        >
          {{ getRenderBalance(t.balance) }} {{ t.symbol }}
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
