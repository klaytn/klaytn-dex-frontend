import routerABI from '../utils/smartcontracts/router.json'
import factoryABI from '../utils/smartcontracts/factory.json'
import wethABI from '../utils/smartcontracts/weth.json'

export default ({ app }, inject) => {
  inject('kaikas', {
    address: null,
    routerAddress: "0xb625E113024a542D6FfbE58f36a23DA8dB19D7EC",
    factoryAddress: "0x1AaBb781A195995245a717A5248a9525eb0C3EB5",
    wethAddress: "0x21F401Ad98c494b2Ac8495edE866F25c67142f47",
    routerContract: null,
    factoryContract: null,
    wethContract: null,

    async connectKaikas(){
      if (process.server || typeof window?.klaytn === 'undefined' || typeof window?.caver === 'undefined') {
        return
      }
      const {klaytn, caver} = window;
      const addresses = await klaytn.enable()

      this.address = addresses[0]
      this.routerContract = new caver.klay.Contract(routerABI.abi, this.routerAddress)
      this.factoryContract = new caver.klay.Contract(factoryABI.abi, this.factoryAddress)
      this.wethContract = new caver.klay.Contract(wethABI.abi, this.wethAddress)
      return addresses[0]
    },

    createContract(address, abi) {
      return new caver.klay.Contract(abi, address)
    },

    getFormattedAddress(address) {
      const addressLength = address.length;
      return `${address.slice(2, 6)}...${address.slice(addressLength - 6, addressLength - 2)}`
    }
  })
}
