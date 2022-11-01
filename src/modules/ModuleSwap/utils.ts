import { Percent, Token, Wei } from '@/core'
import invariant from 'tiny-invariant'

type ComputeFeeResult = FeeItem[]

export interface FeeItem {
  fee: Wei
  pair: [input: Token, output: Token]
}

export function computeFeesByAmounts({
  amounts,
  path,
  commission,
}: {
  amounts: Wei[]
  path: Token[]
  commission: Percent
}): ComputeFeeResult {
  invariant(amounts.length === path.length)

  const commissionQuotient = commission.quotient

  // eslint-disable-next-line max-params
  return amounts.reduce((acc, amount, i, { length: len }) => {
    if (i < len - 1) {
      const pair = path.slice(i, i + 2) as [Token, Token]
      const fee = new Wei(amount.asBigNum.multipliedBy(commissionQuotient).decimalPlaces(0))
      acc.push({ pair, fee })
    }

    return acc
  }, [] as FeeItem[])
}
