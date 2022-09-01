import invariant from 'tiny-invariant'

import TokenImpl from './TokenImpl'
import Pair from './Pair'
import Price from './Price'
import { Address } from '../types'
import Fraction from './Fraction'
import TokenAmount from './TokenAmount'
import Graph from './Graph'
import { arrayEquals } from '@/utils/common'
import { POOL_COMMISSION } from '../const'

interface FromBestRateProps {
  pairs: Pair[]
  inputToken: TokenImpl
  outputToken: TokenImpl
  amount: TokenAmount
}

const ONE = new Fraction(1)

export default class Route {
  public static fromBestRate({ pairs, inputToken, outputToken, amount }: FromBestRateProps): Route | null {
    const graph = new Graph<Address>()
    pairs.forEach((pair) => {
      const commissionCoefficient = POOL_COMMISSION.plus(ONE)
      let token0Price = pair.token0Price.toFraction()
      let token1Price = pair.token1Price.toFraction()
      if (token0Price.isGreaterOrEqualThan(ONE)) {
        token0Price = token0Price.multipliedBy(commissionCoefficient)
        token1Price = token1Price.dividedBy(commissionCoefficient)
      } else {
        token0Price = token0Price.dividedBy(commissionCoefficient)
        token1Price = token1Price.multipliedBy(commissionCoefficient)
      }
      graph.addEdge({
        source: pair.token0.address,
        destination: pair.token1.address,
        weight: token0Price.invert(),
        // weight: new Fraction(pair.reserve1.raw, pair.reserve0.raw),
      })
      graph.addEdge({
        source: pair.token1.address,
        destination: pair.token0.address,
        weight: token1Price.invert(),
        // weight: new Fraction(pair.reserve0.raw, pair.reserve1.raw),
      })
    })

    function getShortestPath() {
      const shortestPath = graph.shortestPath({ source: inputToken.address, destination: outputToken.address })
      if (!shortestPath) return null

      const { path, weight } = shortestPath

      const pathPairs: Pair[] = []
      for (let i = 0; i < path.length - 1; i++) {
        const pair = pairs.find(
          (item) =>
            (item.token0.address === path[i] && item.token1.address === path[i + 1]) ||
            (item.token1.address === path[i] && item.token0.address === path[i + 1]),
        )!
        pathPairs.push(pair)
      }

      return {
        path,
        pairs: pathPairs,
        weight,
      }
    }

    function getShortestPathWithEnoughLiquidity() {
      let bestPossiblePath: ReturnType<typeof getShortestPath> = null
      let path: ReturnType<typeof getShortestPath> = null

      while (!path) {
        const possiblePath = getShortestPath()
        if (!possiblePath || (bestPossiblePath && arrayEquals(possiblePath.path, bestPossiblePath.path))) break
        else if (!bestPossiblePath || bestPossiblePath.weight.isLessThan(possiblePath.weight)) {
          bestPossiblePath = possiblePath
        }

        const processedPath = [...possiblePath.path]
        const processedPairs = [...possiblePath.pairs]
        if (amount.token.equals(outputToken)) {
          processedPath.reverse()
          processedPairs.reverse()
        }
        let currentAmount: Fraction = amount
        let enoughLiquidity = true

        for (const [i, pair] of processedPairs.entries()) {
          const inputTokenAddress = processedPath[amount.token.equals(outputToken) ? i + 1 : 1]
          const inputTokenReserve = pair.token0.address === inputTokenAddress ? pair.reserve0 : pair.reserve1
          const outputTokenAddress = processedPath[amount.token.equals(outputToken) ? i : i + 1]
          const outputTokenReserve = pair.token0.address === outputTokenAddress ? pair.reserve0 : pair.reserve1
          if (currentAmount.isGreaterThan(outputTokenReserve)) {
            enoughLiquidity = false
            graph.removeEdge({
              source: inputTokenAddress,
              destination: outputTokenAddress,
            })
            break
          }
          currentAmount = currentAmount.multipliedBy(inputTokenReserve.dividedBy(outputTokenReserve))
        }

        if (enoughLiquidity) path = possiblePath
      }

      if (amount.token.equals(inputToken)) path = bestPossiblePath

      return path
    }

    const path = getShortestPathWithEnoughLiquidity()

    if (!path) return null

    return new Route(path.pairs, inputToken, outputToken)
  }

  public readonly pairs: Pair[]
  public readonly path: TokenImpl[]
  public readonly input: TokenImpl
  public readonly output: TokenImpl
  public readonly midPrice: Price

  public constructor(pairs: Pair[], input: TokenImpl, output?: TokenImpl) {
    const path: TokenImpl[] = [input]
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

  public toString(): string {
    return this.path.map((token) => token.symbol).join(' > ')
  }
}
