<script lang="ts" setup>
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'
import { formatPercent, formatRate } from '@/utils/common'
import DetailsRow from './DetailsRow.vue'
import Details from './Details.vue'
import { toRefs, not } from '@vueuse/core'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const show = useVModel(props, 'modelValue', emit)

const liquidityStore = useLiquidityStore()
const { tokens, wei } = toRefs(toRef(liquidityStore, 'selection'))
const { pair, isAddLiquidityPending: isInProgress, isSubmitted } = storeToRefs(liquidityStore)

function supply() {
  liquidityStore.addLiquidity()
}
</script>

<template>
  <SModal
    v-model:show="show"
    @after-close="liquidityStore.clearSubmittion()"
  >
    <KlayModalCard
      title="Confirm Supply"
      class="w-[344px]"
    >
      <div v-if="isSubmitted">
        <div class="text-xl text-center font-bold p-6 mb-16">
          Transaction Submitted
        </div>

        <KlayButton
          type="primary"
          size="lg"
          class="w-full"
          @click="show = false"
        >
          Close
        </KlayButton>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <Details v-if="tokens.tokenA && tokens.tokenB && wei.tokenA && wei.tokenB">
          <template #title>
            Prices and pool share
          </template>

          <DetailsRow>
            <span>
              {{ tokens.tokenA.symbol }} per
              {{ tokens.tokenB.symbol }}
            </span>
            <span>
              {{ formatRate(wei.tokenA.input, wei.tokenB.input) }}
            </span>
          </DetailsRow>
          <DetailsRow>
            <span>
              {{ tokens.tokenB.symbol }} per
              {{ tokens.tokenA.symbol }}
            </span>
            <span>
              {{ formatRate(wei.tokenB.input, wei.tokenA.input) }}
            </span>
          </DetailsRow>
          <DetailsRow v-if="pair.pair">
            <span>Share of pool</span>
            <span>
              {{ formatPercent(pair.pair.pairBalance, pair.pair.userBalance) }}
            </span>
          </DetailsRow>
        </Details>

        <KlayButton
          type="button"
          size="lg"
          class="w-full"
          :loading="isInProgress"
          @click="supply()"
        >
          Confirm Supply
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.slippage {
  margin-top: 16px;
}

.error {
  text-align: center;
  margin-top: 16px;
  font-weight: 700;
}

.submitted {
  padding-top: 98px;
  padding-bottom: 138px;
  text-align: center;

  & p {
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 180%;
    color: $dark2;
  }
}

.m-title {
  color: $dark2;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  margin-bottom: 7px;
}

.m-content {
  padding: 16px;
  box-sizing: border-box;
}

.m-head {
  display: flex;
  align-items: center;
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 36px;
  color: $dark2;

  & img {
    width: 36px;
  }
}

.btn {
  margin-top: 16px;
}
</style>
