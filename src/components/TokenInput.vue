<script lang="ts" setup>
import invariant from 'tiny-invariant'
import { formatAddress, Token, Address, ValueWei, tokenRawToWei, tokenWeiToRaw } from '@/core/kaikas'
import { roundTo } from 'round-to'
import BigNumber from 'bignumber.js'

const props = withDefaults(
  defineProps<{
    token: Address
    modelValue: ValueWei<string>
    isLoading?: boolean
    isDisabled?: boolean
  }>(),
  {
    isLoading: false,
    isDisabled: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: ValueWei<string>): void
  (event: 'update:token', value: Address): void
}>()

const addrFormatted = $computed(() => {
  return formatAddress(props.token)
})

const tokensStore = useTokensStore()
const tokenData = $computed<null | Token>(() => tokensStore.tokens?.find((x) => x.address === props.token) ?? null)
const balance = $computed<null | ValueWei<BigNumber>>(() => tokensStore.userBalanceMap?.get(props.token) ?? null)
const balanceFormatted = $computed(() => {
  if (!balance || !tokenData) return '-'
  return roundTo(Number(tokenWeiToRaw(tokenData, props.modelValue)), 5)
})

function tokenDataAnyway(): Token {
  const token = tokenData
  invariant(token)

  return token
}

const model = $computed<string>({
  get: () => {
    return tokenWeiToRaw(tokenDataAnyway(), props.modelValue)
  },
  set: (raw) => {
    emit('update:modelValue', tokenRawToWei(tokenDataAnyway(), raw))
  },
})

const tokenModel = useVModel(props, 'token', emit)

const clipboard = useClipboard()
</script>

<template>
  <div
    v-if="tokenData"
    class="token-input"
    :class="{ 'token-loading': isLoading }"
  >
    <div class="token-value">
      <input
        v-model="model"
        :disabled="isDisabled"
        placeholder="0"
        type="number"
      >

      <button
        v-if="balance"
        @click="model = balance!.toString()"
      >
        MAX
      </button>
      <div class="token-select-wrap">
        <TokenSelect v-model="tokenModel" />
      </div>
    </div>
    <div class="token-meta">
      <div class="row">
        <KlayTextField
          :title="balance"
          class="price"
        >
          Balance: {{ balanceFormatted }}
        </KlayTextField>

        <KlayIcon name="important" />

        <div class="token-info">
          <p>{{ tokenData.name }} {{ `(${tokenData.symbol})` }}</p>
          <span class="price"> - </span>
          <span class="percent">0.26%</span>

          <div
            class="address"
            @click="clipboard.copy(token)"
          >
            <span class="address-name">{{ addrFormatted }}</span>
            <KlayIcon name="copy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.token {
  &-loading {
    opacity: 0.4;
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
