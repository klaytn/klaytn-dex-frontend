<script setup lang="ts" name="ModuleFarmingPool">
import { RoiType, RouteName } from '@/types'
import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import BigNumber from 'bignumber.js'
import { useEnableState } from '../ModuleEarnShared/composable.check-enabled'
import { CONSTANT_FARMING_DECIMALS } from './utils'
import {
  ADDRESS_FARMING,
  Address,
  CurrencySymbol,
  LP_TOKEN_DECIMALS,
  Wei,
  WeiAsToken,
  makeExplorerLinkToAccount,
} from '@/core'
import { SYMBOL_USD, formatCurrency } from '@/utils/composable.currency-input'
import { TokensPair } from '@/utils/pair'
import StakeUnstakeModal from './Modal.vue'
import WalletConnectButton from '@/components/WalletConnectButton.vue'
import { useBalance } from '../ModuleEarnShared/composable.balance'
import { PromiseStateAtomic } from '@vue-kakuyaku/core'
import PoolHead from './PoolHead.vue'

const dexStore = useDexStore()
const tokensStore = useTokensStore()
const { notify } = useNotify()

const router = useRouter()
const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    pool: Pool
    expanded?: boolean
  }>(),
  { expanded: false },
)

const { pool } = toRefs(props)

const emit = defineEmits<{
  (e: 'staked' | 'unstaked', value: WeiAsToken): void
  (e: 'withdrawn'): void
  (e: 'update:expanded', value: boolean): void
}>()

const expanded = useVModel(props, 'expanded', emit, { passive: true })

const modalOperation = ref<ModalOperation | null>(null)
const showRoiCalculator = ref(false)
const roiType = RoiType.Farming
const roiPool = ref<Pool | null>(null)

const balance = useBalance(logicOr(modalOperation, showRoiCalculator), {
  address: props.pool.pairId,
  decimals: LP_TOKEN_DECIMALS,
})

const poolSymbols = computed<TokensPair<CurrencySymbol>>(() => {
  const [a, b] = props.pool.name.split('-') as CurrencySymbol[]
  return { tokenA: a, tokenB: b }
})

const formattedLiquidity = computed(() => {
  return formatCurrency({
    amount: pool.value.liquidity.decimalPlaces(0, BigNumber.ROUND_UP),
    symbol: SYMBOL_USD,
  })
})

const formattedMultiplier = computed(() => {
  return 'x' + new BigNumber(pool.value.multiplier.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const stats = computed(() => {
  return {
    earned: pool.value.earned,
    annualPercentageRate: pool.value.annualPercentageRate,
    liquidity: formattedLiquidity.value,
    multiplier: formattedMultiplier.value,
  }
})

const liquidityAddStore = useLiquidityAddStore()

const prepareLpAddNavigationScope = useDeferredScope<PromiseStateAtomic<TokensPair<Address>>>()

whenever(
  () => prepareLpAddNavigationScope.scope.value?.expose.fulfilled?.value,
  (tokens) => {
    liquidityAddStore.setBothAddresses(tokens)
    router.push({ name: RouteName.LiquidityAdd })
  },
)

const isLpAddNavigationPending = computed(() => prepareLpAddNavigationScope.scope.value?.expose.pending ?? false)

function triggerLpAddNavigation() {
  prepareLpAddNavigationScope.setup(() => {
    const dex = dexStore.anyDex.dex()
    const pairId = pool.value.pairId

    const { state } = useTask(
      async () => {
        const pair = dex.tokens.pairAddressToTokensPair(pairId)
        return pair
      },
      { immediate: true },
    )

    useNotifyOnError(state, notify, 'Failed to derive tokens')

    return state
  })
}

const {
  pending: checkEnabledInProgress,
  enable,
  enabled,
} = useEnableState({
  contract: eagerComputed(() => pool.value.pairId),
  spender: ADDRESS_FARMING,
  active: expanded,
})

const loading = computed(() => {
  // FIXME include "enableTask" pending here too?
  return checkEnabledInProgress.value
})

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

const { state: withdrawState, run: withdraw } = useTask(async () => {
  const dex = dexStore.getNamedDexAnyway()

  await dex.earn.farming.withdraw({ poolId: props.pool.id, amount: new Wei(0) })
})

usePromiseLog(withdrawState, 'farming-pool-withdraw')

wheneverDone(withdrawState, (result) => {
  if (result.fulfilled) {
    notify({ type: 'ok', description: `Tokens were withdrawn` })
    emit('withdrawn')

    tokensStore.touchUserBalance()
  } else {
    notify({ type: 'err', description: 'Withdraw DEX tokens error', error: result.rejected.reason })
  }
})

function handleStaked(amount: WeiAsToken<BigNumber>) {
  modalOperation.value = null
  emit('staked', amount.toFixed() as WeiAsToken)
}

function handleUnstaked(amount: WeiAsToken<BigNumber>) {
  modalOperation.value = null
  emit('unstaked', amount.toFixed() as WeiAsToken)
}

function openRoiCalculator() {
  showRoiCalculator.value = true
  roiPool.value = pool.value
}
</script>

<template>
  <KlayAccordionItem
    v-model="expanded"
    class="module-farming-pool"
  >
    <template #title>
      <PoolHead
        :name="pool.name"
        :earned="pool.earned"
        :annual-percentage-rate="pool.annualPercentageRate"
        :liquidity="pool.liquidity"
        :multiplier="pool.multiplier"
        @click:roi-calculator="openRoiCalculator"
      />
    </template>
    <div
      v-if="loading"
      class="w-full flex justify-center"
    >
      <KlayLoader />
    </div>

    <template v-else>
      <div class="flex md:items-end lt-md:flex-col gap-4 md:gap-6">
        <WalletConnectButton
          v-if="!dexStore.isWalletConnected"
          size="md"
        />

        <template v-else-if="!enabled">
          <KlayButton
            class="md:w-60"
            type="primary"
            @click="enable()"
          >
            Enable {{ pool.name }} balance
          </KlayButton>

          <KlayButton
            class="md:w-50"
            :loading="isLpAddNavigationPending"
            @click="triggerLpAddNavigation()"
          >
            Get {{ pool.name }} LP
          </KlayButton>
        </template>

        <template v-else>
          <div :class="$style.input">
            <div :class="$style.inputLabel">
              Staked LP Tokens
            </div>
            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormatTruncate
                  :class="$style.inputValue"
                  :amount="pool.staked"
                  max-width="auto"
                />
              </template>

              <template #right>
                <div class="space-x-2">
                  <KlayButton @click="unstake()">
                    -
                  </KlayButton>
                  <KlayButton @click="stake()">
                    +
                  </KlayButton>
                </div>
              </template>
            </InputCurrencyTemplate>
          </div>
          <div :class="$style.input">
            <div :class="$style.inputLabel">
              Earned DEX Tokens
            </div>
            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormatTruncate
                  :class="$style.inputValue"
                  :amount="pool.earned"
                  max-width="auto"
                />
              </template>

              <template #right>
                <KlayButton
                  :disabled="pool.earned?.isZero() ?? true"
                  @click="withdraw()"
                >
                  Withdraw
                </KlayButton>
              </template>
            </InputCurrencyTemplate>
          </div>
          <div class="h-72px flex items-center">
            <KlayButton
              class="lt-md:w-full md:w-50"
              @click="triggerLpAddNavigation()"
            >
              Get {{ pool.name }} LP
            </KlayButton>
          </div>
        </template>
      </div>

      <div class="flex items-center flex-wrap gap-4 mt-6">
        <KlayExternalLink :href="makeExplorerLinkToAccount(ADDRESS_FARMING)">
          View Contract
        </KlayExternalLink>
        <KlayExternalLink :href="makeExplorerLinkToAccount(pool.pairId)">
          See Pair Info
        </KlayExternalLink>
      </div>
    </template>
  </KlayAccordionItem>

  <StakeUnstakeModal
    :pool-id="pool.id"
    :operation="modalOperation"
    :staked="pool.staked"
    :balance="balance"
    :symbols="poolSymbols"
    @close="modalOperation = null"
    @staked="handleStaked"
    @unstaked="handleUnstaked"
  />

  <ModuleEarnSharedRoiCalculator
    v-if="roiPool"
    v-model:show="showRoiCalculator"
    :type="roiType"
    :balance="balance"
    :show-balance-button="dexStore.isWalletConnected"
    :staked="roiPool.staked"
    :apr="roiPool.annualPercentageRate"
    :lp-apr="roiPool.lpAnnualPercentageRate"
    :stake-token-price="roiPool.stakeTokenPrice"
    :stake-token-decimals="CONSTANT_FARMING_DECIMALS.decimals"
    :reward-token-decimals="CONSTANT_FARMING_DECIMALS.decimals"
    :stake-token-symbol="pool.name"
    reward-token-symbol="DEX"
  />
</template>

<style lang="scss" module>
@use '@/styles/vars';

.input {
  display: flex;
  flex-direction: column;
  width: 388px;
  max-width: 100%;

  &-label {
    font-weight: 500;
    font-size: 12px;
    color: vars.$gray2;
    margin-bottom: 8px;
  }

  &-value {
    font-style: normal;
    font-weight: 600;
    font-size: 30px;
    line-height: 36px;
  }
}
</style>

<style lang="scss">
@use '@/styles/vars';

.module-farming-pool .klay-accordion-item__chevron-wrapper {
  height: 56px;
  @media only screen and (min-width: vars.$md) {
    height: 100%;
  }
}
</style>
