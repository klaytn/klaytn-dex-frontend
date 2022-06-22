import web3 from 'web3'
import BigNumber from 'bignumber.js'

class Utils {
  getFormattedAddress(address) {
    const addressLength = address.length
    return `${address.slice(2, 6)}...${address.slice(
      addressLength - 6,
      addressLength - 2,
    )}`
  }

  isEmptyAddress(address) {
    return Number(address?.slice(2)) === 0
  }

  isNativeToken(address) {
    return address === '0xae3a8a1D877a446b22249D8676AFeB16F056B44e'
  }

  toWei(token, amount = 'ether') {
    return web3.utils.toWei(token, amount)
  }

  isAddress(value) {
    return web3.utils.isAddress(value)
  }

  fromWei(amount) {
    return web3.utils.fromWei(amount)
  }

  bigNumber(amount) {
    return new BigNumber(amount)
  }

  sortKlayPair(tokenA, tokenB) {
    if (this.isNativeToken(tokenA.address))
      return [tokenB, tokenA]

    return [tokenA, tokenB]
  }
}
const utils = new Utils()

export default utils
