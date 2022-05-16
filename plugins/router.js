
export const fn = () => {
  console.log({this: this})
}


export default class Router {
  contract = null;
  address = null;

  constructor(address, abi) {
    const { caver } = window;
    this.contract = new caver.klay.Contract(abi, address);
  }

  getAmountOut() {
    console.log()
  //   const pairAddress = await this.$kaikas.factoryContract.methods
  //     .getPair(tokenA.address, tokenB.address)
  //     .call({
  //       from: this.$kaikas.address,
  //     });
  //
  //   const pairAddress2 = await this.$kaikas.factoryContract.methods
  //     .getPair(tokenB.address, tokenA.address)
  //     .call({
  //       from: this.$kaikas.address,
  //     });
  //
  //   if (this.$kaikas.isEmptyAddress(pairAddress)) {
  //     commit("SET_EMPTY_PAIR", [tokenA.address, tokenB.address]);
  //     return;
  //   }
  //
  //   const pairContract = this.$kaikas.createContract(pairAddress, pair.abi);
  //
  //   const pairBalance = await pairContract.methods.totalSupply().call();
  //   const userBalance = await pairContract.methods
  //     .balanceOf(this.$kaikas.address)
  //     .call();
  //
  //   // const pairContract = this.$kaikas.createContract(pairAddress, pair.abi);
  //   // const reserves = await pairContract.methods.getReserves().call({
  //   //   from: this.$kaikas.address,
  //   // });
  //   //
  //   // const getAmountOut = await this.$kaikas.routerContract.methods
  //   //   .getAmountOut(value, reserves[1], reserves[0])
  //   //   .call({
  //   //     from: this.$kaikas.address,
  //   //   });
  //
  //   const getAmountsOut = await this.$kaikas.routerContract.methods
  //     .getAmountsOut(value, [tokenA.address, tokenB.address])
  //     .call();
  }
}
