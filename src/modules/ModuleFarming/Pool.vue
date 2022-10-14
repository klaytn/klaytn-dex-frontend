<script setup lang="ts" name="ModuleFarmingPool">
import { RouteName, RoiType } from '@/types'
import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import BigNumber from 'bignumber.js'
import { useEnableState } from '../ModuleEarnShared/composable.check-enabled'
import { KlayIconCalculator, KlayIconLink } from '~klay-icons'
import { CONSTANT_FARMING_DECIMALS } from './utils'
import {
  Wei,
  ADDRESS_FARMING,
  WeiAsToken,
  CurrencySymbol,
  makeExplorerLinkToAccount,
  LP_TOKEN_DECIMALS,
  Address,
} from '@/core'
import { formatCurrency, SYMBOL_USD } from '@/utils/composable.currency-input'
import { TokensPair } from '@/utils/pair'
import StakeUnstakeModal from './Modal.vue'
import WalletConnectButton from '@/components/WalletConnectButton.vue'
import invariant from 'tiny-invariant'
import { or } from '@vueuse/core'
import { useBalance } from '../ModuleEarnShared/composable.balance'
import { PromiseStateAtomic } from '@vue-kakuyaku/core'

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

const balance = useBalance(or(modalOperation, showRoiCalculator), {
  address: props.pool.pairId,
  decimals: LP_TOKEN_DECIMALS,
})

const poolSymbols = computed<TokensPair<CurrencySymbol>>(() => {
  const [a, b] = props.pool.name.split('-') as CurrencySymbol[]
  return { tokenA: a, tokenB: b }
})

const formattedAnnualPercentageRate = computed(() => {
  return '%' + new BigNumber(pool.value.annualPercentageRate.toFixed(2, BigNumber.ROUND_UP))
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
    annualPercentageRate: formattedAnnualPercentageRate.value,
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

  const earned = pool.value.earned
  await dex.earn.farming.withdraw({ poolId: props.pool.id, amount: new Wei(0) })

  return { earned }
})

usePromiseLog(withdrawState, 'farming-pool-withdraw')

wheneverDone(withdrawState, (result) => {
  if (result.fulfilled) {
    const { earned } = result.fulfilled.value
    invariant(earned)
    const formatted = formatCurrency({ amount: earned })
    notify({ type: 'ok', description: `${formatted} DEX tokens were withdrawn` })
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
  <KlayAccordionItem v-model="expanded">
    <template #title>
      <div class="grid grid-cols-5">
        <div class="flex items-center space-x-2">
          <KlaySymbolsPair v-bind="poolSymbols" />

          <span class="title-name">
            {{ pool.name }}
          </span>
        </div>

        <div
          v-for="(value, label) in stats"
          :key="label"
        >
          <div class="stats-item-label">
            {{ t(`ModuleFarmingPool.stats.${label}`) }}
          </div>

          <div
            v-if="label === 'annualPercentageRate'"
            class="stats-item-value flex items-center space-x-2"
          >
            <span>
              {{ value }}
            </span>
            <KlayIconCalculator
              class="calculator-icon"
              @click.stop="openRoiCalculator()"
            />
          </div>

          <div
            v-else-if="label === 'earned'"
            class="stats-item-value"
          >
            <CurrencyFormatTruncate :amount="value" />
          </div>

          <div
            v-else
            class="stats-item-value"
          >
            {{ value }}
          </div>
        </div>
      </div>
    </template>

    <div class="min-h-84px flex flex-col justify-center">
      <template v-if="expanded">
        <div
          v-if="loading"
          class="h-full flex items-center justify-center"
        >
          <KlayLoader />
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-if="!dexStore.isWalletConnected"
            class="flex items-center space-x-6"
          >
            <WalletConnectButton
              v-if="!dexStore.isWalletConnected"
              size="md"
            />
          </div>
          <div
            v-else-if="!enabled"
            class="flex items-center space-x-6"
          >
            <KlayButton
              class="w-60"
              type="primary"
              @click="enable()"
            >
              Enable {{ pool.name }} balance
            </KlayButton>

            <KlayButton
              class="w-50"
              :loading="isLpAddNavigationPending"
              @click="triggerLpAddNavigation()"
            >
              Get {{ pool.name }} LP
            </KlayButton>
          </div>

          <div
            v-else
            class="enabled-grid"
          >
            <span class="input-label">Staked LP Tokens</span>

            <div class="input-label flex items-center">
              <span class="flex-1">Earned DEX Tokens</span>
            </div>

            <span />

            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormat
                  v-slot="{ formatted }"
                  :amount="pool.staked"
                >
                  <input
                    :value="formatted"
                    readonly
                  >
                </CurrencyFormat>
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

            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormat
                  v-slot="{ formatted }"
                  :amount="pool.earned"
                  decimals="6"
                >
                  <input
                    :value="formatted"
                    readonly
                  >
                </CurrencyFormat>
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

            <KlayButton
              class="w-50"
              @click="triggerLpAddNavigation()"
            >
              Get {{ pool.name }} LP
            </KlayButton>
          </div>

          <div class="flex items-center space-x-4">
            <a
              class="link-with-icon"
              target="_blank"
              :href="makeExplorerLinkToAccount(ADDRESS_FARMING)"
            >
              <span>View Contract</span>
              <KlayIconLink />
            </a>
            <a
              class="link-with-icon"
              target="_blank"
              :href="makeExplorerLinkToAccount(pool.pairId)"
            >
              <span>See Pair Info</span>
              <KlayIconLink />
            </a>
          </div>
        </div>
      </template>
    </div>
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

<style lang="scss" scoped>
@use '@/styles/vars';

.input-label {
  font-size: 12px;
}

.loader-wrapper {
  height: 82px;
}

.title-name {
  font-size: 16px;
}

.stats-item {
  &-label {
    font-weight: 500;
    font-size: 12px;
    color: vars.$gray2;
    line-height: 100%;
  }

  &-value {
    font-weight: 600;
    font-size: 16px;
    color: vars.$dark;
    margin-top: 2px;
    margin-bottom: 12px;
  }
}

.calculator-icon {
  color: vars.$gray3;
  height: 18px;

  &:hover {
    color: vars.$blue;
  }
}

.enabled-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 24px;
  row-gap: 8px;
  align-items: center;
}

.link-with-icon {
  display: flex;
  align-items: center;

  & > :first-child {
    font-size: 12px;
  }
  & > :last-child {
    color: vars.$gray3;
    margin-left: 8px;
  }
}
</style>
