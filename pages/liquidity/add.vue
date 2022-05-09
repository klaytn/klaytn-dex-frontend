<template>
  <Wrap>
    <template v-slot:head>
      <RouterLink to="/liquidity" class="back">
        <Icon name="back-arrow"/>
        <span>
          Add Liquidity
        </span>
      </RouterLink>
    </template>
    <template>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus alias esse est et mollitia praesentium quae,
      ratione reprehenderit vero voluptates. Ab accusantium cupiditate maiores obcaecati saepe. Doloremque ratione sed
      voluptatem?
    </template>
  </Wrap>
</template>

<style lang="scss" scoped>
.back {
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: $dark2;
  display: flex;
  align-items: center;

  & span {
    margin-left: 11px;
  }
}
</style>
