import web3 from 'web3'
import type { Unit } from 'web3-utils'
import BigNumber from 'bignumber.js'

import type { Address, Token } from '@/types'

class Utils {
  getFormattedAddress(address: Address) {
    const addressLength = address.length
    return `${address.slice(2, 6)}...${address.slice(
      addressLength - 6,
      addressLength - 2,
    )}`
  }

  isEmptyAddress(address: string) {
    return Number(address?.slice(2)) === 0
  }

  isNativeToken(address: string) {
    return address === '0xae3a8a1D877a446b22249D8676AFeB16F056B44e'
  }

  toWei(token: string, amount: Unit = 'ether') {
    return web3.utils.toWei(token, amount)
  }

  isAddress(address: string) {
    return web3.utils.isAddress(address)
  }

  fromWei(amount: string) {
    return web3.utils.fromWei(amount)
  }

  bigNumber(amount: BigNumber.Value) {
    return new BigNumber(amount)
  }

  sortKlayPair(tokenA: Token, tokenB: Token) {
    if (this.isNativeToken(tokenA.address))
      return [tokenB, tokenA]

    return [tokenA, tokenB]
  }
}
const utils = new Utils()

export default utils
