import type {
  Contract as ContractEthers,
  ContractTransaction,
  PayableOverrides,
  BigNumber as BigNumberEthers,
} from 'ethers'
import type { AbiContractEthers, AbiContractWeb3, AvailableAbi } from '../abi'
import type {
  BaseContract as ContractWeb3,
  NonPayableTransactionObject,
  PayableTransactionObject,
  PayableTx,
} from '../typechain-web3/types'
import type { AllExceptLast } from '@/types'
import type { Address } from '../types'
import Wei from './Wei'
import type { ContractForLib } from './agent'
import Debug from 'debug'

const moduleDebug = Debug('iso-contract')

type AssertExtends<T, U extends T> = 'ok'

type GetEthersContractMethods<T extends ContractEthers> = keyof T['functions']

type GetWeb3ContractMethods<T extends ContractWeb3> = keyof T['methods']

type GetEthersContract<A extends AvailableAbi> = AbiContractEthers[A]

type GetWeb3Contract<A extends AvailableAbi> = AbiContractWeb3[A]

type GetBothMethods<A extends AvailableAbi> = GetEthersContractMethods<GetEthersContract<A>> &
  GetWeb3ContractMethods<GetWeb3Contract<A>>

type GetEthersMethod<C extends ContractEthers, M extends string> = C extends { functions: { [k in M]: infer F } }
  ? F
  : never

type Test123 = GetEthersMethod<GetEthersContract<'router'>, 'addLiquidity'>

type GetEthersMethodArgs<A extends AvailableAbi, M extends string> = AllExceptLast<
  Parameters<GetEthersMethod<GetEthersContract<A>, M>>
>

type GetWeb3MethodArgs<A extends AvailableAbi, M extends string> = Parameters<GetWeb3Contract<A>['methods'][M]>

type GetBothArgs<A extends AvailableAbi, M extends string> = GetEthersMethodArgs<A, M> & GetWeb3MethodArgs<A, M>

type GetEthersCallResult<A extends AvailableAbi, M extends string> = GetEthersContract<A> extends {
  [k in M]: (...args: any) => Promise<infer Result>
}
  ? Result extends ContractTransaction
    ? never
    : Result
  : never

type TestEthersCall1 = AssertExtends<BigNumberEthers, GetEthersCallResult<'kip7', 'balanceOf'>>

type TestEthersCall2 = AssertExtends<never, GetEthersCallResult<'router', 'addLiquidity'>>

type GetWeb3CallResult<A extends AvailableAbi, M extends string> = GetWeb3Contract<A>['methods'] extends {
  [k in M]: (...args: any) => NonPayableTransactionObject<infer Result>
}
  ? Result
  : never

type TestWeb3Call1 = AssertExtends<string, GetWeb3CallResult<'kip7', 'balanceOf'>>

type TestWeb3Call2 = AssertExtends<
  {
    amountA: string
    amountB: string
    liquidity: string
    0: string
    1: string
    2: string
  },
  GetWeb3CallResult<'router', 'addLiquidity'>
>

type GetCallResult<A extends AvailableAbi, M extends string> = GetEthersCallResult<A, M> | GetWeb3CallResult<A, M>

export interface BuiltMethod<CallResult> {
  call: () => Promise<CallResult>
  estimateGas: () => Promise<bigint>
  send: (params: { gas: bigint }) => Promise<void>
}

type MethodBuilder<A extends AvailableAbi, M extends string> = (
  args: GetBothArgs<A, M>,
  overrides?: IsomorphicOverrides,
) => BuiltMethod<GetCallResult<A, M>>

export interface IsomorphicOverrides {
  from?: Address
  gasPrice?: Wei
  value?: Wei
}

export type IsomorphicContract<A extends AvailableAbi> = {
  [M in GetBothMethods<A> & string]: MethodBuilder<A, M>
}

type TestA = IsomorphicContract<'router'>

type TestAA = GetEthersMethodArgs<'router', 'addLiquidity'>

type TestAAA = Parameters<GetEthersMethod<GetEthersContract<'router'>, 'addLiquidity'>>

type TestWeb3Args = GetWeb3MethodArgs<'router', 'addLiquidity'>

export function isomorphicContract<A extends AvailableAbi>(contract: ContractForLib<A>): IsomorphicContract<A> {
  if (contract.lib === 'ethers') {
    const { ethers: x } = contract
    const debug = moduleDebug.extend('ethers')

    const methods = Object.keys(x.functions)

    return Object.fromEntries(
      methods.map<[string, MethodBuilder<A, any>]>((method) => {
        const builder: MethodBuilder<A, any> = (args, overrides) => {
          const normOverrides: PayableOverrides & { from?: Address } = {
            from: overrides?.from,
            gasPrice: overrides?.gasPrice?.asBigInt,
            value: overrides?.value?.asBigInt,
          }

          return {
            call: () => {
              debug('call():', method, args, overrides)
              return (x as ContractEthers)[method](...args, normOverrides)
            },
            estimateGas: () => {
              debug('estimateGas():', method, args, overrides)
              return (
                (x as ContractEthers).estimateGas[method](...args, normOverrides) as Promise<BigNumberEthers>
              ).then((x) => x.toBigInt())
            },
            send: async ({ gas }) => {
              debug('send():', method, args, overrides)
              await (x as ContractEthers)[method](...args, { ...normOverrides, gasLimit: gas })
            },
          }
        }

        return [method, builder]
      }),
    ) as IsomorphicContract<A>
  }

  const { web3: x } = contract
  const debug = moduleDebug.extend('web3')

  const methods = Object.keys(x.methods)

  return Object.fromEntries(
    methods.map<[string, MethodBuilder<A, any>]>((method) => {
      const builder: MethodBuilder<A, any> = (args, overrides) => {
        const normOverrides: PayableTx = {}
        overrides?.from && (normOverrides.from = overrides.from)
        overrides?.gasPrice && (normOverrides.gasPrice = overrides.gasPrice.asStr)
        overrides?.value && (normOverrides.value = overrides.value.asStr)

        const createTxObject = () => (x as ContractWeb3).methods[method](...args) as PayableTransactionObject<any>

        return {
          call: () => {
            debug('call():', method, args, overrides)
            return createTxObject()
              .call(normOverrides)
              .catch((e) => {
                debug('%o failed: %o', method, e)
                throw e
              })
          },
          estimateGas: async () => {
            debug('estimateGas():', method, args, overrides)
            const gas = await createTxObject().estimateGas(normOverrides)
            return BigInt(gas)
          },
          send: async ({ gas }) => {
            debug('send():', method, args, overrides)
            await createTxObject().send({ ...normOverrides, gas: gas.toString() })
          },
        }
      }

      return [method, builder]
    }),
  ) as IsomorphicContract<A>
}
