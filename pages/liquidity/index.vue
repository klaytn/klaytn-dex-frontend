<template>
  <Wrap>
    <p class="liquidity--title">Add liquidity to receive LP tokens</p>
    <RouterLink to="/liquidity/add">
      <Button class="liquidity--btn"> Add Liquidity</Button>
    </RouterLink>

    <p class="liquidity--title mt">Your Liquidity</p>

    <div class="liquidity--list">
      <div class="liquidity--item">
        <Collapse>
          <template v-slot:head>
            <div class="pair--head">
              <img
                class="pair--icon-f"
                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png"
                alt=""
              />
              <img
                class="pair--icon-s"
                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png"
                alt=""
              />
              <span class="pair--names"> BNB-KLAY </span>
              <span class="pair--rate">
              0.23 <span class="pair--rate-gray">($5.87) </span></span
              >
            </div>
          </template>
          <template v-slot:main>
            <div class="pair--main">

              <div class="pair--info">
                <div class="pair--row">
                  <span>Pooled ETH</span>
                  <span>0.0232</span>
                </div>
                <div class="pair--row">
                  <span>Pooled DAI</span>
                  <span>34.5649</span>
                </div>
                <div class="pair--row">
                  <span>Your pool tokens:</span>
                  <span>0.2192</span>
                </div>
                <div class="pair--row">
                  <span>Your pool share:</span>
                  <span>0.69%</span>
                </div>
              </div>

              <div class="pair--links">
                <a href="#">Add</a>
                <a href="#">Remove</a>
                <a href="#" class="deposit">Deposit</a>
              </div>

            </div>
          </template>
        </Collapse>
      </div>
      <div class="liquidity--item">
        <Collapse>
          <template v-slot:head>
            <div class="pair--head">
              <img
                class="pair--icon-f"
                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png"
                alt=""
              />
              <img
                class="pair--icon-s"
                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png"
                alt=""
              />
              <span class="pair--names"> BNB-KLAY </span>
              <span class="pair--rate">
              0.23 <span class="pair--rate-gray">($5.87) </span></span
              >
            </div>
          </template>
          <template v-slot:main>
            <div class="pair--main">

              <div class="pair--info">
                <div class="pair--row">
                  <span>Pooled ETH</span>
                  <span>0.0232</span>
                </div>
                <div class="pair--row">
                  <span>Pooled DAI</span>
                  <span>34.5649</span>
                </div>
                <div class="pair--row">
                  <span>Your pool tokens:</span>
                  <span>0.2192</span>
                </div>
                <div class="pair--row">
                  <span>Your pool share:</span>
                  <span>0.69%</span>
                </div>
              </div>

              <div class="pair--links">
                <a href="#">Add</a>
                <a href="#">Remove</a>
                <a href="#" class="deposit">Deposit</a>
              </div>

            </div>
          </template>
        </Collapse>
      </div>
      <div class="liquidity--item">
        <Collapse>
          <template v-slot:head>
            <div class="pair--head">
              <img
                class="pair--icon-f"
                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png"
                alt=""
              />
              <img
                class="pair--icon-s"
                src="https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_700/MTgyNTk1NDg5MDc2Njg0MTI4/maker-protokoll-dai-stablecoin-and-mkr-token-explained.png"
                alt=""
              />
              <span class="pair--names"> BNB-KLAY </span>
              <span class="pair--rate">0.23 <span class="pair--rate-gray">($5.87) </span></span>
            </div>
          </template>
          <template v-slot:main>
            <div class="pair--main">

              <div class="pair--info">
                <div class="pair--row">
                  <span>Pooled ETH</span>
                  <span>0.0232</span>
                </div>
                <div class="pair--row">
                  <span>Pooled DAI</span>
                  <span>34.5649</span>
                </div>
                <div class="pair--row">
                  <span>Your pool tokens:</span>
                  <span>0.2192</span>
                </div>
                <div class="pair--row">
                  <span>Your pool share:</span>
                  <span>0.69%</span>
                </div>
              </div>

              <div class="pair--links">
                <a href="#">Add</a>
                <a href="#">Remove</a>
                <a href="#" class="deposit">Deposit</a>
              </div>

            </div>
          </template>
        </Collapse>
      </div>
    </div>
  </Wrap>
</template>

<style scoped lang="scss">
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
      background: #FFFFFF;
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
