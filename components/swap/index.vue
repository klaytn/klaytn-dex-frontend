<template>
  <div class="wrap">

    <div class="head">
      <button class="head--btn head--btn-active">
        Swap
      </button>
      <button class="head--btn">
        Liquidity
      </button>
      <button class="head--btn head--btn-left">
        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.00977 12.5C2.00977 17.47 6.03977 21.5 11.0098 21.5C13.3998 21.5 15.6898 20.56 17.4098 18.9L15.9098 17.4C14.6398 18.75 12.8698 19.5 11.0098 19.5C4.76977 19.5 1.64977 11.96 6.05977 7.55C10.4698 3.14 18.0098 6.27 18.0098 12.5H15.0098L19.0098 16.5H19.1098L23.0098 12.5H20.0098C20.0098 7.53 15.9798 3.5 11.0098 3.5C6.03977 3.5 2.00977 7.53 2.00977 12.5Z"
            fill="#ADB9CE"/>
        </svg>
      </button>
      <button class="head--btn">
        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 13.5C6.14 13.5 4.59 14.78 4.14 16.5H3C2.44772 16.5 2 16.9477 2 17.5C2 18.0523 2.44772 18.5 3 18.5H4.14C4.59 20.22 6.14 21.5 8 21.5C9.86 21.5 11.41 20.22 11.86 18.5H21C21.5523 18.5 22 18.0523 22 17.5C22 16.9477 21.5523 16.5 21 16.5H11.86C11.41 14.78 9.86 13.5 8 13.5ZM8 19.5C6.9 19.5 6 18.6 6 17.5C6 16.4 6.9 15.5 8 15.5C9.1 15.5 10 16.4 10 17.5C10 18.6 9.1 19.5 8 19.5ZM19.86 6.5C19.41 4.78 17.86 3.5 16 3.5C14.14 3.5 12.59 4.78 12.14 6.5H3C2.44771 6.5 2 6.94772 2 7.5C2 8.05228 2.44772 8.5 3 8.5H12.14C12.59 10.22 14.14 11.5 16 11.5C17.86 11.5 19.41 10.22 19.86 8.5H21C21.5523 8.5 22 8.05228 22 7.5C22 6.94772 21.5523 6.5 21 6.5H19.86ZM16 9.5C14.9 9.5 14 8.6 14 7.5C14 6.4 14.9 5.5 16 5.5C17.1 5.5 18 6.4 18 7.5C18 8.6 17.1 9.5 16 9.5Z"
            fill="#313131"/>
        </svg>
      </button>
    </div>

    <TokenInput></TokenInput>

    <button class="change-btn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="10" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.998 7.0415C10.998 6.48814 11.4466 6.03955 12 6.03955C12.5534 6.03955 13.002 6.48814 13.002 7.0415V14.5782L15.8954 11.6847C16.2867 11.2934 16.9211 11.2934 17.3124 11.6847C17.7037 12.076 17.7037 12.7104 17.3124 13.1017L12.7086 17.7054C12.513 17.9011 12.2565 17.9989 12.0001 17.9989C11.7436 17.9989 11.4872 17.9011 11.2915 17.7054L6.6941 13.108C6.30281 12.7167 6.30281 12.0823 6.6941 11.691C7.08539 11.2998 7.71979 11.2998 8.11108 11.691L10.998 14.578V7.0415Z" fill="#313131"/>
      </svg>
    </button>

    <div class="margin-block">
      <TokenInput></TokenInput>
    </div>

    <div class="slippage">
      <Collapse label="Slippage tolerance"></Collapse>
    </div>

    <Button>Swap</Button>

    <div class="slippage">
      <Collapse label="Transaction Details"></Collapse>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrap {
  background: linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  padding: 19px 16px;
  border-radius: 20px;
  overflow: hidden;
  margin: auto;
  max-width: 420px;
  width: 100%;
}

.head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 18px;

  &--btn {
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 150%;
    color: $gray2;
    margin-right: 18px;
    cursor: pointer;

    &-left {
      margin-left: auto;
    }

    &:last-child {
      margin-right: 0;
    }
    &-active {
      color: $dark
    }
  }
}

.change-btn {
  margin-top: -10px;
}

.margin-block {
  margin: -10px 0;
}

.slippage {
  margin: 20px 0;
}
</style>
