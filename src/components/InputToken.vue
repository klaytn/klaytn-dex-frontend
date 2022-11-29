<script lang="ts" setup>
import { Address, WeiAsToken } from '@/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { KlayIconImportant } from '~klay-icons'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'
import TokenSelect from './TokenSelect.vue'
import { SPopover } from '@soramitsu-ui/ui'
import PopperInfo from './InputTokenPopperInfo.vue'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'

interface Props {
  address?: Address
  selected?: Set<Address>
  modelValue?: WeiAsToken<BigNumber> | null
  valueDebounce?: number
  isLoading?: boolean
  setByBalance?: boolean
  // FIXME not by design
  estimated?: boolean
  showWarning?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: WeiAsToken<BigNumber>): void
  (event: 'update:address', value: Address): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  isLoading: false,
  setByBalance: false,
  estimated: false,
  valueDebounce: 500,
})

const emit = defineEmits<Emits>()

// #region  Model

const model = useVModel(props, 'modelValue', emit) as Ref<BigNumber | null>

const modelDebounced = shallowRef<BigNumber | null>(model.value)

watch(model, (value) => {
  if (!value || (modelDebounced.value && !value.eq(modelDebounced.value))) modelDebounced.value = value
})

watchDebounced(
  modelDebounced,
  (value) => {
    if (!value || (model.value && !value.eq(model.value))) model.value = value
  },
  { debounce: toRef(props, 'valueDebounce') },
)

// #endregion

// #region Stores

const dexStore = useDexStore()
const { isWalletConnected } = storeToRefs(dexStore)

const tokensStore = useTokensStore()
const { isBalancePending } = storeToRefs(tokensStore)

const { lookupDerivedUsd, lookupBalance, lookupToken } = useMinimalTokensApi()

const balance = computed(() => props.address && lookupBalance(props.address))
const derivedUsd = computed(() => props.address && lookupDerivedUsd(props.address))
const tokenData = computed(() => props.address && lookupToken(props.address))

const balanceAsToken = computed(() => balance.value && tokenData.value && balance.value.decimals(tokenData.value))

// #endregion

const showMaxButton = $computed(
  () => props.setByBalance && balance.value && model.value && !model.value.eq(balance.value.asBigNum),
)

const addressModel = useVModel(props, 'address', emit)

function setToMax() {
  invariant(balanceAsToken.value)
  model.value = balanceAsToken.value
}

const isWarning = computedEager(() => {
  return !!(
    !props.isLoading &&
    props.showWarning &&
    balanceAsToken.value &&
    modelDebounced.value &&
    modelDebounced.value.isGreaterThan(balanceAsToken.value)
  )
})
</script>

<template>
  <InputCurrencyTemplate
    :class="{ 'pointer-events-none': isLoading }"
    :loading="isLoading"
    bottom
    size="lg"
    :max-button="showMaxButton"
    @click:max="setToMax()"
  >
    <template #input>
      <CurrencyInput
        v-if="tokenData && modelDebounced"
        v-model="modelDebounced"
        :decimals="tokenData.decimals"
        :disabled="isLoading"
        :warning="isWarning"
      />
    </template>

    <template #top-right>
      <TokenSelect
        v-model:token="addressModel"
        v-bind="{ selected }"
        data-testid="token-select"
      />
    </template>

    <template #bottom-left>
      <span
        v-if="estimated"
        class="estimated"
      > estimated * </span>
    </template>

    <template #bottom-right>
      <SPopover
        placement="bottom-end"
        distance="8"
        hide-delay="150"
      >
        <template #trigger>
          <div class="balance flex items-center space-x-2">
            <span class="flex items-center">
              <span class="whitespace-pre">Balance: </span>
              <span
                v-if="isWalletConnected"
                class="inline-block truncate max-w-20"
              >
                <CurrencyFormat :amount="balanceAsToken" />
              </span>
              <span v-else>Connect Wallet</span>
            </span>

            <KlayLoader
              v-if="isBalancePending"
              color="gray"
              size="14"
            />

            <KlayIconImportant class="icon-info" />
          </div>
        </template>

        <template #popper="{ show }">
          <PopperInfo
            v-if="show && tokenData && balance"
            :token="tokenData"
            :balance="balanceAsToken"
            :derived-usd="derivedUsd"
          />
        </template>
      </SPopover>
    </template>
  </InputCurrencyTemplate>
</template>

<style scoped lang="scss">
@use '@/styles/vars';

.balance,
.estimated {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 1em;
  color: #778294;
  user-select: none;
}

.icon-info {
  font-size: 16px;
  color: #c2cbda;
}

.balance {
  cursor: pointer;

  &:hover .icon-info {
    color: vars.$gray2;
  }
}
</style>
