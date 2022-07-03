import Config from './Config'
import Liquidity from './Liquidity'
import Swap from './Swap'
import Tokens from './Tokens'
import { Address, Balance, Token } from './types'
import { KIP7 as KIP7_ABI } from './smartcontracts/abi'
import type { KIP7 } from '@/types/typechain/tokens'

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

  public async createToken(addr: Address): Promise<Token> {
    const contract = this.cfg.createContract<KIP7>(addr, KIP7_ABI)

    return {
      // id: addr,
      address: addr,

      // FIXME Promise.all
      name: await contract.methods.name().call(),
      symbol: await contract.methods.symbol().call(),
      balance: (await contract.methods.balanceOf(addr).call()) as Balance,
    }
  }
}
