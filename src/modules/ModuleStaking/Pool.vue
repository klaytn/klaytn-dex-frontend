<script setup lang="ts" name="ModuleStakingPool">
import { ModalOperation, Pool } from './types'
import { RouteName, RoiType } from '@/types'
import BigNumber from 'bignumber.js'
import { useEnableState } from '../ModuleEarnShared/composable.check-enabled'
import { Wei, WeiAsToken, makeExplorerLinkToAccount } from '@/core'
import ModalCard from './ModalCard.vue'
import { SModal } from '@soramitsu-ui/ui'
import { formatCurrency } from '@/utils/composable.currency-input'
import PoolHead from './PoolHead.vue'
import WalletConnectButton from '@/components/WalletConnectButton.vue'
import invariant from 'tiny-invariant'
import AddToWallet from './PoolAddToWallet.vue'
import { useBalance } from '../ModuleEarnShared/composable.balance'
import { or } from '@vueuse/core'

const dexStore = useDexStore()
const tokensStore = useTokensStore()
const { notify } = useNotify()

const router = useRouter()
const { t } = useI18n()

const props = defineProps<{
  pool: Pool
  blockNumber: null | number
}>()

const emit = defineEmits<{
  (e: 'staked' | 'unstaked', value: WeiAsToken<BigNumber>): void
  (e: 'withdrawn'): void
}>()

const expanded = ref(false)
const modalOperation = ref<ModalOperation | null>(null)
const showRoiCalculator = ref(false)

const modalOpen = computed({
  get() {
    return !!modalOperation.value
  },
  set(value) {
    if (!value) modalOperation.value = null
  },
})

const balance = useBalance(or(modalOpen, showRoiCalculator), {
  address: props.pool.stakeToken.id,
  decimals: props.pool.stakeToken.decimals,
})

const endsIn = computedEager<number>(() => {
  const {
    pool: { endBlock },
    blockNumber,
  } = props
  return blockNumber ? endBlock - blockNumber : 0
})

const {
  pending: loading,
  enable,
  enabled,
} = useEnableState({
  contract: computedEager(() => props.pool.stakeToken.id),
  spender: computedEager(() => props.pool.id),
  active: expanded,
})

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

const { state: addToWalletState, set: setAddToWalletPromise } = usePromise()

function addRewardTokenToWallet(pool: Pool) {
  async function action() {
    await dexStore.getNamedDexAnyway().agent.watchAsset({
      address: pool.rewardToken.id,
      symbol: pool.rewardToken.symbol,
      decimals: pool.rewardToken.decimals,
    })
  }

  setAddToWalletPromise(action())
}

usePromiseLog(addToWalletState, 'add-reward-token-to-wallet')

const swapStore = useSwapStore()

function goToSwapPage() {
  const { rewardToken, stakeToken } = props.pool
  swapStore.setBothTokens({
    tokenA: rewardToken.id,
    tokenB: stakeToken.id,
  })
  router.push({ name: RouteName.Swap })
}

const { state: withdrawState, run: withdraw } = useTask(async () => {
  const {
    pool: { earned, id: poolId },
  } = props
  await dexStore.getNamedDexAnyway().earn.staking.withdraw({ amount: new Wei(0), poolId })
  return { earned }
})

usePromiseLog(withdrawState, 'staking-pool-withdraw')

wheneverDone(withdrawState, (result) => {
  if (result.fulfilled) {
    const { earned } = result.fulfilled.value
    invariant(earned)
    const formatted = formatCurrency({
      amount: earned,
      symbol: { str: props.pool.rewardToken.symbol, position: 'right' },
    })
    notify({ type: 'ok', description: `${formatted} tokens were withdrawn` })
    emit('withdrawn')

    tokensStore.touchUserBalance()
  } else {
    notify({
      type: 'err',
      description: `Withdraw ${props.pool.rewardToken.symbol} tokens error`,
      error: result.rejected.reason,
    })
  }
})

function handleStaked(amount: WeiAsToken<BigNumber>) {
  modalOperation.value = null
  emit('staked', amount)
}

function handleUnstaked(amount: WeiAsToken<BigNumber>) {
  modalOperation.value = null
  emit('unstaked', amount)
}

function openRoiCalculator() {
  showRoiCalculator.value = true
}
</script>

<template>
  <KlayAccordionItem v-model="expanded">
    <template #title>
      <PoolHead
        :reward-token-symbol="pool.rewardToken.symbol"
        :stake-token-symbol="pool.stakeToken.symbol"
        :earned="pool.earned"
        :total-staked-usd="pool.totalStaked"
        :annual-percentage-rate="pool.annualPercentageRate"
        :ends-in="endsIn"
        @click:roi-calculator="openRoiCalculator"
      />
    </template>

    <div v-if="loading">
      <KlayLoader />
    </div>

    <template v-else>
      <div class="flex items-center space-x-6">
        <WalletConnectButton
          v-if="!dexStore.isWalletConnected"
          size="md"
        />
        <template v-else-if="!enabled">
          <KlayButton
            type="primary"
            @click="enable()"
          >
            Enable {{ pool.stakeToken.symbol }}
          </KlayButton>

          <KlayButton @click="goToSwapPage()">
            Get {{ pool.stakeToken.symbol }}
          </KlayButton>
        </template>

        <template v-else>
          <div>
            <div class="input-label">
              {{ t('ModuleStakingPool.staked', { symbol: pool.stakeToken.symbol }) }}
            </div>

            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormat
                  v-slot="{ formatted }"
                  :amount="pool.staked"
                >
                  <input
                    readonly
                    :value="formatted"
                  >
                </CurrencyFormat>
              </template>

              <template #right>
                <KlayButton
                  v-if="pool.staked.isZero()"
                  type="primary"
                  @click="stake()"
                >
                  Stake {{ pool.stakeToken.symbol }}
                </KlayButton>

                <div
                  v-else
                  class="space-x-2"
                >
                  <KlayButton @click="unstake()">
                    -
                  </KlayButton>
                  <KlayButton
                    :disabled="!pool.active"
                    @click="stake()"
                  >
                    +
                  </KlayButton>
                </div>
              </template>
            </InputCurrencyTemplate>
          </div>

          <div>
            <div class="input-label">
              {{ t('ModuleStakingPool.earned', { symbol: pool.rewardToken.symbol }) }}
            </div>

            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormat
                  v-slot="{ formatted }"
                  :amount="pool.earned"
                >
                  <input
                    readonly
                    :value="formatted"
                  >
                </CurrencyFormat>
              </template>

              <template #right>
                <KlayButton
                  :disabled="!pool.earned || pool.earned.isZero()"
                  @click="withdraw()"
                >
                  Withdraw
                </KlayButton>
              </template>
            </InputCurrencyTemplate>
          </div>
        </template>
      </div>

      <div class="flex items-center space-x-4 mt-6">
        <KlayExternalLink :href="makeExplorerLinkToAccount(pool.stakeToken.id)">
          See Token Info
        </KlayExternalLink>
        <!-- FIXME href? -->
        <!-- <KlayExternalLink>View Project Site</KlayExternalLink> -->
        <KlayExternalLink :href="makeExplorerLinkToAccount(pool.id)">
          View Contract
        </KlayExternalLink>
        <AddToWallet
          v-if="dexStore.active.kind === 'named'"
          :connected="dexStore.active.wallet"
          @click="addRewardTokenToWallet(pool)"
        />
      </div>
    </template>
  </KlayAccordionItem>

  <SModal
    :show="!!modalOperation"
    @update:show="!$event && (modalOperation = null)"
  >
    <ModalCard
      :pool-id="pool.id"
      :operation="modalOperation!"
      :staked="pool.staked"
      :balance="balance"
      :stake-token="pool.stakeToken"
      @staked="handleStaked"
      @unstaked="handleUnstaked"
    />
  </SModal>

  <ModuleEarnSharedRoiCalculator
    v-model:show="showRoiCalculator"
    :type="RoiType.Staking"
    :staked="pool.staked"
    :apr="pool.annualPercentageRate"
    :balance="balance"
    :stake-token-price="pool.stakeTokenPrice"
    :stake-token-decimals="pool.stakeToken.decimals"
    :reward-token-decimals="pool.rewardToken.decimals"
    :stake-token-symbol="pool.stakeToken.symbol"
    :reward-token-symbol="pool.rewardToken.symbol"
  />
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.add-to-kaikas {
  cursor: pointer;
  &:hover {
    color: vars.$blue;
  }
}

.input-label {
  font-weight: 500;
  font-size: 12px;
  color: vars.$gray2;

  margin-bottom: 16px;
}
</style>
