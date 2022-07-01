import Config from './Config'
import Liquidity from './Liquidity'
import Swap from './Swap'
import Tokens from './Tokens'

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
}
