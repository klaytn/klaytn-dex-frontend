<script lang="ts" setup>
import { formatAddress, Token, Address, ValueWei, tokenRawToWei, tokenWeiToRaw } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import IconInfo from '@/assets/icons/important.svg'
import { useScope } from '@vue-kakuyaku/core'
import { ComputedRef } from 'vue'

const props = withDefaults(
  defineProps<{
    token?: Address
    modelValue?: ValueWei<string>
    isLoading?: boolean
    isDisabled?: boolean
  }>(),
  {
    isLoading: false,
    isDisabled: false,
  },
)

const emit = defineEmits(['update:modelValue', 'update:token'])

let modelWei = $toRef(props, 'modelValue')

const addrFormatted = $computed(() => {
  return props.token && formatAddress(props.token)
})

const kaikasStore = useKaikasStore()
const { isConnected: isKaikasConnected } = $(storeToRefs(kaikasStore))

const tokensStore = useTokensStore()

const tokenData = $computed<null | Token>(
  () => (props.token && tokensStore.tokens?.find((x) => x.address === props.token)) ?? null,
)

const scope = useScope(
  computed(() => !!tokenData),
  () => {
    const tokenDataForSure = $($$(tokenData) as ComputedRef<Token>)

    const valueModel = useWei(
      $$(modelWei),
      computed(() => tokenDataForSure.decimals),
    )
  },
)

const balance = $computed<null | ValueWei<BigNumber>>(
  () => (props.token && tokensStore.userBalanceMap?.get(props.token)) ?? null,
)
const balanceFormatted = $computed(() => {
  if (!balance || !tokenData) return '—'
  return tokenWeiToRaw(tokenData, balance.toString() as ValueWei<string>)
})

const model = $computed<string>({
  get: () => {
    if (!tokenData) return ''
    return tokenWeiToRaw(tokenData, props.modelValue ?? ('0' as ValueWei<string>))
  },
  set: (raw) => {
    if (!tokenData) return
    const num = Number(raw)
    if (Number.isNaN(num)) return
    emit('update:modelValue', tokenRawToWei(tokenData, raw))
  },
})

const tokenModel = useVModel(props, 'token', emit)

function setToMax() {
  invariant(balance)
  emit('update:modelValue', balance.toString())
}

// const clipboard = useClipboard()
</script>

<template>
  <div
    class="root space-y-2"
    :class="{ 'root--loading': isLoading }"
  >
    <div class="flex items-center space-x-2">
      <input
        v-model="model"
        :disabled="isDisabled"
        placeholder="0"
      >

      <button
        v-if="balance"
        class="max"
        @click="setToMax()"
      >
        MAX
      </button>

      <div class="select-wrap">
        <TokenSelect v-model:token="tokenModel" />
      </div>
    </div>

    <div class="flex">
      <div class="flex-1" />

      <KlayTextField
        :title="balance"
        class="balance flex space-x-2"
      >
        <span>
          <template v-if="isKaikasConnected"> Balance: {{ balanceFormatted }} </template>
          <template v-else> Balance: Connect Wallet </template>
        </span>
        <IconInfo class="m-0" />
      </KlayTextField>

      <!-- <div
          v-if="tokenData"
          class="token-info"
        >
          <p>{{ tokenData.name }} {{ `(${tokenData.symbol})` }}</p>
          <span class="price"> - </span>
          <span class="percent">0.26%</span>

          <div
            class="address"
            @click="clipboard.copy(token!)"
          >
            <span class="address-name">{{ addrFormatted }}</span>
            <KlayIcon name="copy" />
          </div>
        </div>
      </div> -->
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.root {
  background: $gray3;
  padding: 16px 16px;
  border-radius: 8px;

  &--loading {
    opacity: 0.4;
  }
}

input {
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 130%;
  color: $dark2;
  background: transparent;
  border: none;
  min-width: 0;
  flex: 1;
}

button.max {
  font-weight: 700;
  font-size: 10px;
  line-height: 16px;
  background: $blue;
  border-radius: 8px;
  color: $white;
  padding: 4px 8px;
  cursor: pointer;
}

.balance {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  color: $gray4;
  max-width: 200px;
}

.token {
  &-loading {
  }

  &-select-wrap {
    margin-left: auto;
  }

  &-input {
    background: $gray3;
    padding: 16px 16px;
    border-radius: 8px;
  }

  &-value {
    display: flex;
    align-items: center;

    & input {
      font-style: normal;
      font-weight: 600;
      font-size: 30px;
      line-height: 130%;
      color: $dark2;
      background: transparent;
      border: none;
      max-width: 212px;
      width: 100%;
    }

    & button {
      font-weight: 700;
      font-size: 10px;
      line-height: 16px;
      background: $blue;
      border-radius: 8px;
      color: $white;
      padding: 4px 8px;
      margin-left: 8px;
      cursor: pointer;
    }
  }

  &-meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;

    & .price {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: $gray4;
      margin-right: 6px;
      max-width: 200px;
    }

    & .row {
      display: flex;
      align-items: center;
      height: 25px;

      &:hover {
        cursor: pointer;

        & .token-info {
          display: block !important;
        }
      }
    }
  }

  &-info {
    display: none;
    background: $white;
    position: absolute;
    top: 20px;
    right: -80px;
    width: 176px;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 16px;
    box-sizing: border-box;
    z-index: 9;
    text-align: left;

    &:after {
      display: block;
      content: '';
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 10px solid $white;
      top: -9px;
      left: calc(50% - 6px);
      position: absolute;
    }

    & p {
      font-style: normal;
      font-weight: 700;
      font-size: 13px;
      line-height: 16px;
      margin-bottom: 8px;
    }

    & .price {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      max-width: 100px;
    }

    & .percent {
      color: $green;
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
    }

    & .link {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 180%;
      display: flex;
      align-items: center;
      color: $dark2;
      margin-top: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid $gray5;

      & .svg-icon {
        height: 15px;
      }

      & span {
        margin-right: 5px;
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 180%;

        &:hover {
          color: $blue;
        }
      }
    }

    & .address {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 180%;
      display: flex;
      align-items: center;
      color: $dark2;
      margin-top: 4px;
      cursor: pointer;

      & .svg-icon {
        height: 15px;
      }

      & span {
        margin-right: 5px;
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 180%;

        &:hover {
          color: $blue;
        }
      }
    }
  }
}
</style>
