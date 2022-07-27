import Config from './Config'
import Liquidity from './Liquidity'
import Swap from './Swap'
import Tokens from './Tokens'
import type { Address } from './types'

export default class Kaikas {
  public readonly cfg: Config
  public readonly liquidity: Liquidity
  public readonly swap: Swap
  public readonly tokens: Tokens

  public constructor(cfg: Config) {
    this.tokens = new Tokens(cfg)
    this.liquidity = new Liquidity({ cfg, tokens: this.tokens })
    this.swap = new Swap(cfg)
    this.cfg = cfg
  }

  /**
   * Self address shorthand
   */
  public get selfAddress(): Address {
    return this.cfg.addrs.self
  }
}
