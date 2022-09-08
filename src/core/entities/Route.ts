import TokenImpl from './TokenImpl'
import Pair from './Pair'
import Price from './Price'

import { UniRoute, UniToken } from './uni-entities'

export default class Route {
  public static fromUniRoute(route: UniRoute<UniToken, UniToken>): Route {
    return new Route({
      pairs: route.pairs.map((x) => Pair.fromUni(x)),
      input: TokenImpl.fromUni(route.input),
      output: TokenImpl.fromUni(route.output),
      midPrice: Price.fromUni(route.midPrice),
      path: route.path.map((x) => TokenImpl.fromUni(x)),
    })
  }

  public readonly pairs!: Pair[]
  public readonly path!: TokenImpl[]
  public readonly input!: TokenImpl
  public readonly output!: TokenImpl
  public readonly midPrice!: Price

  protected constructor(props: Pick<Route, 'pairs' | 'input' | 'output' | 'midPrice' | 'path'>) {
    Object.assign(this, props)
  }

  public toString(): string {
    return this.path.map((token) => token.symbol).join(' > ')
  }
}
