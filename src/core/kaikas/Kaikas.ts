import Config from './Config'
import Liquidity from './Liquidity'
import Swap from './Swap'
import Tokens from './Tokens'
import { Address, Balance, Token } from './types'
import { KIP7 as KIP7_ABI } from './smartcontracts/abi'
import type { KIP7 } from '@/types/typechain/tokens'
import { isNativeToken } from './utils'

export default class Kaikas {
  public readonly cfg: Config
  public readonly liquidity: Liquidity
  public readonly swap: Swap
  public readonly tokens: Tokens

  public constructor(cfg: Config) {
    this.liquidity = new Liquidity(cfg)
    this.swap = new Swap(cfg)
    this.tokens = new Tokens(cfg)
    this.cfg = cfg
  }

  /**
   * Self address shorthand
   */
  public get selfAddress(): Address {
    return this.cfg.addrs.self
  }

  public async getToken(addr: Address): Promise<Token> {
    const contract = this.cfg.createContract<KIP7>(addr, KIP7_ABI)
    const [name, symbol, decimals] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods
        .decimals()
        .call()
        .then((x) => Number(x)),
    ])
    return { address: addr, name, symbol, decimals }
  }

  public async getTokenBalance(addr: Address): Promise<Balance> {
    if (isNativeToken(addr)) {
      // we can't get KLAY balance via KIP7 contract, because it returns a balance of WKLAY,
      // which is not correct
      const balance = (await this.cfg.caver.rpc.klay.getBalance(this.selfAddress)) as Balance
      return balance
    }

    const contract = this.cfg.createContract<KIP7>(addr, KIP7_ABI)
    const balance = (await contract.methods.balanceOf(this.selfAddress).call()) as Balance
    return balance
  }

  public async isSmartContract(addr: Address): Promise<boolean> {
    const code = await this.cfg.caver.klay.getCode(addr)
    return code !== '0x'
  }
}
