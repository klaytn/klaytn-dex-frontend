import web3 from 'web3'
import BigNumber from 'bignumber.js'

import Tokens from './tokens'
import utils from './utils'
import config from './Config'
import Swap from './swap'
import Liquidity from './liquidity'

class Kaikas {
  address = null
  routerAddress = '0xB0B695584234F2CC16266588b2b951F3d2885705'
  factoryAddress = '0xEB487a3A623E25cAa668B6D199F1aBa9D2380456'
  wethAddress = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e'
  routerContract = null
  factoryContract = null
  wethContract = null
  caver = null

  liquidity = null
  swap = null
  tokens = null
  utils = null

  constructor() {
    this.config = config
    this.utils = utils

    this.tokens = new Tokens()
    this.swap = new Swap()
    this.liquidity = new Liquidity()
  }

  createContract(address, abi) {
    const { caver } = window
    return new caver.klay.Contract(abi, address)
  }

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
    if (utils.isNativeToken(tokenA.address))
      return [tokenB, tokenA]

    return [tokenA, tokenB]
  }
}

export default new Kaikas()
