<template>
  <div class="detailed">
    <div class="detailed--input input-amount mt">
      <div class="input-amount--col">
        <input placeholder="0.345" type="text" class="input-amount--value"/>
        <div class="input-amount--price">$284.22</div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <button class="input-amount--max">max</button>
          <!--          <img src="" alt="">-->
          <!--          <img src="" alt="">-->
          <span class="input-amount--tokens">ETH-DAI</span>
        </div>
        <div class="input-amount--price">$284.22</div>
      </div>
    </div>

    <div class="detailed--icon">
      <Icon name="arrow-down"/>
    </div>

    <div class="detailed--input input-amount">
      <div class="input-amount--col">
        <div type="text" class="input-amount--value">0.345</div>
        <div class="input-amount--price">$284.22</div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">ETH</span>
        </div>
      </div>
    </div>

    <div class="detailed--icon">
      <Icon name="plus"/>
    </div>

    <div class="detailed--input input-amount">
      <div class="input-amount--col">
        <div type="text" class="input-amount--value">0.345</div>
        <div class="input-amount--price">$284.22</div>
      </div>
      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">ETH</span>
        </div>
      </div>
    </div>

    <div class="detailed--details">
      <div class="detailed--details--row">
        <div>
          KLAY per ETH
        </div>
        <div>
          812.325 DAI
        </div>
      </div>
      <div class="detailed--details--row">
        <div>
          ETH per KLAY
        </div>
        <div>
          0.093827 ETH
        </div>
      </div>
    </div>

  </div>
</template>

<style lang="scss" src="./index.scss" scoped/>
