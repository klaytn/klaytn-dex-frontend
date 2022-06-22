<script>
import { mapActions, mapState } from 'pinia'
import { roundTo } from 'round-to'
import web3 from 'web3'

export default {
  name: 'Liquidity',
  computed: {
    ...mapState(useLiquidityStore, ['pairs']),
    renderPairs() {
      if (!this.pairs.length)
        return null

      return this.pairs.filter(p => !!Number(p.userBalance))
    },
  },
  beforeMount() {
    this.getPairs()
  },
  methods: {
    ...mapActions(useLiquidityStore, ['getPairs']),
    getFormatted(v) {
      return roundTo(Number(web3.utils.fromWei(v)), 5)
    },
    getFormattedPercent(v1, v2) {
      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)
      const percent = bigNA.dividedToIntegerBy(100)

      return `${bigNB.dividedBy(percent).toFixed(2)}%`
    },

    getFormattedTokens(pairBalance, userBalance, reserve) {
      const bigNA = $kaikas.bigNumber(pairBalance)
      const bigNB = $kaikas.bigNumber(userBalance)

      const yourPoolShare = bigNB.dividedToIntegerBy(bigNA).multipliedBy(100)

      const token0Pooled = $kaikas
        .bigNumber(reserve)
        .multipliedBy(yourPoolShare)
        .dividedToIntegerBy(100)

      return `~${this.getFormatted(token0Pooled.toFixed(0))}`
    },
  },
}
</script>

<template>
  <KlayWrap>
    <p class="liquidity--title">
      Add liquidity to receive LP tokens
    </p>
    <RouterLink to="/liquidity/add">
      <KlayButton class="liquidity--btn">
        Add Liquidity
      </KlayButton>
    </RouterLink>

    <p class="liquidity--title mt">
      Your Liquidity
    </p>

    <div v-if="!renderPairs" class="ma">
      <KlayLoader />
    </div>
    <div v-else-if="!renderPairs.length">
      Empty
    </div>
    <div v-else class="liquidity--list">
      <div v-for="p in renderPairs" :key="p.address" class="liquidity--item">
        <KlayCollapse>
          <template #head>
            <div class="pair--head">
              <div class="pair--icon-f">
                <KlayIcon :char="p.symbolA[0]" name="empty-token" />
              </div>
              <div class="pair--icon-s">
                <KlayIcon :char="p.symbolB[0]" name="empty-token" />
              </div>

              <!--              <img -->
              <!--                class="pair&#45;&#45;icon-f" -->
              <!--                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png" -->
              <!--                alt="" -->
              <!--              /> -->
              <!--              <img -->
              <!--                class="pair&#45;&#45;icon-s" -->
              <!--                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png" -->
              <!--                alt="" -->
              <!--              /> -->
              <span class="pair--names"> {{ p.name }} </span>
              <span v-if="p.userBalance" class="pair--rate">
                {{ getFormatted(p.userBalance) }}
                <!--                <span class="pair&#45;&#45;rate-gray">($5.87) </span> -->
              </span>
            </div>
          </template>
          <template #main>
            <div class="pair--main">
              <div class="pair--info">
                <div v-if="p.pairBalance" class="pair--row">
                  <span>Pooled {{ p.symbolA }}</span>
                  <span>{{
                    getFormattedTokens(
                      p.userBalance,
                      p.pairBalance,
                      p.reserves[0],
                    )
                  }}</span>
                </div>
                <div v-if="p.pairBalance" class="pair--row">
                  <span>Pooled {{ p.symbolB }}</span>
                  <span>{{
                    getFormattedTokens(
                      p.userBalance,
                      p.pairBalance,
                      p.reserves[1],
                    )
                  }}</span>
                </div>
                <div v-if="p.pairBalance" class="pair--row">
                  <span>Pooled {{ p.name }}</span>
                  <span>{{ getFormatted(p.pairBalance) }}</span>
                </div>
                <div class="pair--row">
                  <span>Your pool tokens:</span>
                  <span>{{ getFormatted(p.userBalance) }}</span>
                </div>
                <div class="pair--row">
                  <span>Your pool share:</span>
                  <span>{{
                    getFormattedPercent(p.pairBalance, p.userBalance)
                  }}</span>
                </div>
              </div>

              <div class="pair--links">
                <RouterLink to="/liquidity/add">
                  Add
                </RouterLink>
                <RouterLink :to="`/liquidity/remove/${p.address}`">
                  Remove
                </RouterLink>
                <a href="#" class="deposit">Deposit</a>
              </div>
            </div>
          </template>
        </KlayCollapse>
      </div>
    </div>
  </KlayWrap>
</template>

<style scoped lang="scss">
.ma {
  width: min-content;
  margin: 20px auto;
}

.liquidity {
  text-align: left;

  &--item + * {
    margin-top: 8px;
  }

  &--title {
    text-align: left;
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 17px;
    color: $dark2;
  }

  &--btn {
    margin-top: 17px;
  }

  &--list {
    margin-top: 17px;
  }
}

.pair {
  &--head {
    display: flex;
    align-items: center;
    padding: 5px 0;
    cursor: pointer;
    width: 100%;
  }

  &--icon-f,
  &--icon-s {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: block;
  }

  &--icon-s {
    margin-left: -10px;
    margin-right: 10px;
  }

  &--names {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 17px;
    color: $dark;
    margin-right: 8px;
  }

  &--rate {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 17px;
    color: $dark;

    &-gray {
      color: $gray4;
    }
  }

  &--info {
    margin-top: 11px;
  }

  &--row {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 230%;
    color: $dark;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &--links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;

    & a {
      background: #ffffff;
      box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      font-style: normal;
      font-weight: 700;
      font-size: 14px;
      line-height: 150%;
      padding: 10px;
      width: 113px;
      text-align: center;
      color: $dark;
    }

    & .deposit {
      background: $blue;
      color: $white;
    }
  }
}

.mt {
  margin-top: 17px;
}
</style>
