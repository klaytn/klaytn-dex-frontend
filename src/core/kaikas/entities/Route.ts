import invariant from 'tiny-invariant'
import Graph from 'node-dijkstra'

import Token from './Token'
import Pair from './Pair'
import Price from './Price'
import { Address } from '@/core/kaikas'

export default class Route {
  public static shortestRoute(pairs: Pair[], input: Token, output: Token): Route {
    const graph = new Graph()
    const allPairTokenAddresses = new Set(pairs.map((pair) => [pair.token0.address, pair.token1.address]).flat())
    allPairTokenAddresses.forEach((address) => {
      const directions = pairs.reduce((accumulator, pair) => {
        if (pair.token0.address === address) accumulator.push(pair.token1.address)
        if (pair.token1.address === address) accumulator.push(pair.token0.address)
        return accumulator
      }, [] as Address[])
      graph.addNode(address, Object.fromEntries(directions.map((direction) => [direction, 1])))
    })
    const path = graph.path(input.address, output.address) as Address[]
    const pathPairs: Pair[] = []
    for (let i = 0; i < path.length - 1; i++) {
      const pair = pairs.find(
        (item) =>
          (item.token0.address === path[i] && item.token1.address === path[i + 1]) ||
          (item.token1.address === path[i] && item.token0.address === path[i + 1]),
      )!
      pathPairs.push(pair)
    }
    return new Route(pathPairs, input, output)
  }

  public readonly pairs: Pair[]
  public readonly path: Token[]
  public readonly input: Token
  public readonly output: Token
  public readonly midPrice: Price

  public constructor(pairs: Pair[], input: Token, output?: Token) {
    const path: Token[] = [input]
    for (const [i, pair] of pairs.entries()) {
      const currentInput = path[i]
      invariant(currentInput.equals(pair.token0) || currentInput.equals(pair.token1), 'PATH')
      const output = currentInput.equals(pair.token0) ? pair.token1 : pair.token0
      path.push(output)
    }

    this.pairs = pairs
    this.path = path
    this.midPrice = Price.fromRoute(this)
    this.input = input
    this.output = output ?? path[path.length - 1]
  }

  public get asString(): string {
    return this.path.map((token) => token.symbol).join(' > ')
  }
}
