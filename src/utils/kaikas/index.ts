import web3 from 'web3'
import type { Unit } from 'web3-utils'
import { type AbiItem } from 'caver-js'
import BigNumber from 'bignumber.js'
import type BN from 'bn.js'

import Tokens from './tokens'
import utils from './utils'
import config from './config'
import Swap from './swap'
import Liquidity from './liquidity'
import type { Address, Token } from '@/types'

class Kaikas {
  address = null
  routerAddress = '0xB0B695584234F2CC16266588b2b951F3d2885705'
  factoryAddress = '0xEB487a3A623E25cAa668B6D199F1aBa9D2380456'
  wethAddress = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e'
  routerContract = null
  factoryContract = null
  wethContract = null
  caver = null

  liquidity = new Liquidity()
  swap = new Swap()
  tokens = new Tokens()
  utils = utils
  config = config

  createContract<T>(address: Address, abi: AbiItem[]) {
    const { caver } = window
    return new caver.klay.Contract(abi, address) as unknown as T
  }

  getFormattedAddress(address: Address) {
    const addressLength = address.length
    return `${address.slice(2, 6)}...${address.slice(
      addressLength - 6,
      addressLength - 2,
    )}`
  }

  isEmptyAddress(address: Address) {
    return Number(address?.slice(2)) === 0
  }

  toWei(token: BN, amount: Unit = 'ether') {
    return web3.utils.toWei(token, amount)
  }

  isAddress(address: Address) {
    return web3.utils.isAddress(address)
  }

  fromWei(amount: string | BN) {
    return web3.utils.fromWei(amount)
  }

  bigNumber(amount: BigNumber.Value) {
    return new BigNumber(amount)
  }

  sortKlayPair(tokenA: Token, tokenB: Token) {
    if (utils.isNativeToken(tokenA.address))
      return [tokenB, tokenA]

    return [tokenA, tokenB]
  }
}

export default new Kaikas()
