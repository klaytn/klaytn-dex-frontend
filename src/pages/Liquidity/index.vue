<route lang="yaml">
name: Liquidity
</route>

<script lang="ts">
import { roundTo } from 'round-to'
import gql from 'graphql-tag'

export default {
  name: 'Liquidity',
  data() {
    return {
      emptyUser: false,
    }
  },
  computed: {
    renderPairs() {
      if (!this.pairs?.length) return null

      return this.pairs
    },
  },
  methods: {
    getFormatted(v) {
      return roundTo(Number(v), 5)
    },
    getFormattedPercent(v1, v2) {
      if (v1.toString() === '0') return '0'

      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)
      const percent = bigNA.dividedToIntegerBy(100)

      return `${bigNB.dividedBy(percent).toFixed(2)}%`
    },

    getFormattedTokens(pairBalance, userBalance, reserve) {
      const bigNA = $kaikas.bigNumber(pairBalance)
      const bigNB = $kaikas.bigNumber(userBalance)

      const yourPoolShare = bigNB.dividedToIntegerBy(bigNA).multipliedBy(100)

      const token0Pooled = $kaikas.bigNumber(reserve).multipliedBy(yourPoolShare).dividedToIntegerBy(100)

      return `~${this.getFormatted(token0Pooled.toFixed(0))}`
    },
  },
  apollo: {
    pairs: {
      query: gql`
        query GetUserPairs($id: String!) {
          user(id: $id) {
            liquidityPositions {
              liquidityTokenBalance
              pair {
                id
                name
                reserve0
                reserve1
                mints {
                  amount0
                  amount1
                }
                token0 {
                  id
                  name
                  symbol
                }
                token1 {
                  id
                  name
                  symbol
                }
                reserveKLAY
                reserveUSD
                token1Price
                totalSupply
                volumeUSD
              }
            }
          }
        }
      `,
      variables() {
        return {
          id: $kaikas.config.address.toString().toLowerCase(),
        }
      },
      update({ user }) {
        if (!user) {
          this.emptyUser = true
          return []
        }

        this.emptyUser = true

        return user?.liquidityPositions.map(({ pair, liquidityTokenBalance }) => ({
          ...pair,
          liquidityTokenBalance,
        }))
      },
      skip() {
        this.emptyUser = !$kaikas.config.address
        return this.emptyUser
      },
    },
  },
}
</script>

<template>
  <TradeWrap>
    <p class="liquidity--title">
      Add liquidity to receive LP tokens
    </p>
    <RouterLink to="/liquidity/add">
      <KlayButton class="liquidity--btn">
        Add Liquidity
      </KlayButton>
    </RouterLink>

    <p
      v-if="!emptyUser"
      class="liquidity--title mt"
    >
      Your Liquidity
    </p>

    <div
      v-if="!emptyUser && !renderPairs"
      class="ma"
    >
      <KlayLoader />
    </div>
    <div v-else-if="!emptyUser && !renderPairs?.length">
      Empty
    </div>
    <div
      v-else
      class="liquidity--list"
    >
      <div
        v-for="p in renderPairs"
        :key="p.id"
        class="liquidity--item"
      >
        <KlayCollapse>
          <template #head>
            <div class="pair--head">
              <div class="pair--icon-f">
                <KlayIcon
                  :symbol="p.token0.symbol"
                  name="empty-token"
                />
              </div>
              <div class="pair--icon-s">
                <KlayIcon
                  :symbol="p.token1.symbol"
                  name="empty-token"
                />
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
              <span class="pair--rate">
                {{ getFormatted(p.totalSupply) }}
                <span class="pair--rate-gray">(${{ getFormatted(p.reserveUSD) }}) </span>
              </span>
            </div>
          </template>
          <template #main>
            <div class="pair--main">
              <div class="pair--info">
                <div class="pair--row">
                  <span>Pooled {{ p.token0.name }}</span>
                  <span>
                    {{ getFormatted(p.reserve0) }}
                  </span>
                </div>
                <div class="pair--row">
                  <span>Pooled {{ p.token1.name }}</span>
                  <span>
                    {{ getFormatted(p.reserve1) }}
                  </span>
                </div>
                <div class="pair--row">
                  <span>Your pool tokens:</span>
                  <span>
                    {{ getFormatted(p.liquidityTokenBalance) }}
                  </span>
                </div>
                <div class="pair--row">
                  <span>Your pool share:</span>
                  <span>
                    {{ getFormattedPercent(p.reserveKLAY, p.liquidityTokenBalance) }}
                  </span>
                </div>
              </div>

              <div class="pair--links">
                <RouterLink to="/liquidity/add">
                  Add
                </RouterLink>
                <RouterLink :to="`/liquidity/remove/${p.id}`">
                  Remove
                </RouterLink>
                <a
                  href="#"
                  class="deposit"
                >Deposit</a>
              </div>
            </div>
          </template>
        </KlayCollapse>
      </div>
    </div>
  </TradeWrap>
</template>

<style scoped lang="scss">
@import '@/styles/vars.sass';

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
