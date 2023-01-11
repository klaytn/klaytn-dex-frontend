<script setup lang="ts">
import { CurrencySymbol, LP_TOKEN_DECIMALS, PoolId, WeiAsToken } from '@/core'
import { formatCurrency } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { ModalOperation } from './types'
import InputTokenLp from '@/components/InputTokenLp.vue'
import { TokensPair } from '@/utils/pair'
import { farmingToWei } from './utils'
import StakeUserLimit from '../ModuleEarnShared/StakeUserLimit.vue'
import invariant from 'tiny-invariant'

const props = defineProps<{
  operation: ModalOperation
  poolId: PoolId
  staked: WeiAsToken<BigNumber>
  balance: WeiAsToken<BigNumber> | null
  symbols: null | TokensPair<CurrencySymbol>
}>()

const emit = defineEmits<(e: 'staked' | 'unstaked', amount: WeiAsToken<BigNumber>) => void>()

const { notify } = useNotify()
const dexStore = useDexStore()
const tokensStore = useTokensStore()
const liquidityListStore = useLiquidityListStore()

const inputAmount = shallowRef(new BigNumber(0) as WeiAsToken<BigNumber>)

const stakeToken = computed(() => ({
  symbol: props.symbols?.tokenA + '-' + props.symbols?.tokenB,
  decimals: LP_TOKEN_DECIMALS,
}))

const equationStaked = ref<BigNumber | null>(null)

const label = computed(() => {
  const { operation, staked } = props
  if (operation === ModalOperation.Stake) {
    if (staked.isZero()) {
      return 'Stake LP tokens'
    } else {
      return 'Stake additional LP tokens'
    }
  } else {
    return 'Unstake LP tokens'
  }
})

const notEnough = computed(() => {
  const { balance, operation, staked } = props
  if (!balance) return false

  const compareValue = operation === ModalOperation.Stake ? balance : staked
  return new BigNumber(inputAmount.value).isGreaterThan(compareValue)
})

const lessThanOrEqualToZero = computed(() => {
  return inputAmount.value.isLessThanOrEqualTo(0)
})

const disabled = logicOr(notEnough, lessThanOrEqualToZero)

function setMax() {
  const { balance, operation, staked } = props
  if (operation === ModalOperation.Stake) {
    invariant(balance)
    inputAmount.value = balance
  } else inputAmount.value = staked
}

const maxButtonDisabled = computed(() => {
  const { balance, operation } = props
  return operation === ModalOperation.Stake && (balance === null || balance.isZero())
})

const { state: operationState, run: confirm } = useTask(async () => {
  const dex = dexStore.getNamedDexAnyway()
  const { operation, poolId } = props

  equationStaked.value = props.staked
  const amount = inputAmount.value
  const amountWei = farmingToWei(amount)

  if (operation === 'stake') await dex.earn.farming.deposit({ poolId: props.poolId, amount: amountWei })
  else await dex.earn.farming.withdraw({ poolId, amount: amountWei })

  return { amount, operation }
})

wheneverFulfilled(operationState, ({ amount, operation }) => {
  const amountFormatted = formatCurrency({ amount, decimals: 6 })

  if (operation === ModalOperation.Stake) {
    notify({ type: 'ok', description: `${amountFormatted} LP tokens were staked` })
    emit('staked', amount)
  } else {
    notify({ type: 'ok', description: `${amountFormatted} LP tokens were unstaked` })
    emit('unstaked', amount)
  }

  liquidityListStore.quickPoll = true
  tokensStore.touchUserBalance()
})

useNotifyOnError(operationState, notify, 'Failed to confirm operation')

const loading = toRef(operationState, 'pending')
</script>

<template>
  <KlayModalCard
    class="w-420px lt-sm:mx-2"
    :title="label"
  >
    <div class="space-y-4">
      <InputTokenLp
        v-model="inputAmount"
        :symbols="symbols"
        :max-button-disabled="maxButtonDisabled"
        @click:max="setMax"
      >
        <template #bottom-right>
          <template v-if="operation === ModalOperation.Stake">
            <span :class="$style.bottomLine">Balance:</span>
            <CurrencyFormatTruncate
              :class="$style.bottomLine"
              :amount="balance"
            />
          </template>
          <template v-else>
            <span :class="$style.bottomLine">Staked:</span>
            <CurrencyFormatTruncate
              :class="$style.bottomLine"
              :amount="staked"
            />
          </template>
        </template>
      </InputTokenLp>

      <StakeUserLimit
        :operation="operation"
        :stake-amount="inputAmount"
        :staked="equationStaked || staked"
        :stake-token="stakeToken"
      />

      <KlayButton
        type="primary"
        size="lg"
        class="w-full"
        :disabled="disabled"
        :loading="loading"
        @click="confirm"
      >
        Confirm
      </KlayButton>
    </div>
  </KlayModalCard>
</template>

<style module lang="scss">
@use '@/styles/vars';

.equation {
  font-weight: 600;
  font-size: 16px;
  padding: 16px;
  border: 1px solid vars.$gray5;
  border-radius: 8px;

  &-item {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    vertical-align: bottom;
    &-title {
      top: 0;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 12px;
      color: vars.$gray2;
    }
  }
}

.bottom-line {
  font-size: 12px;
  font-weight: 400;
  color: vars.$gray2;
}
</style>
