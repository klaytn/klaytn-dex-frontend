import type {
  BigNumber as BigNumberEthers,
  Contract as ContractEthers,
  ContractTransaction,
  PayableOverrides,
} from 'ethers'
import type { AbiContractEthers, AbiContractWeb3, AbiToContract, AvailableAbi } from './abi'
import type {
  BaseContract as ContractWeb3,
  NonPayableTransactionObject,
  PayableTransactionObject,
  PayableTx,
} from './typechain-web3/types'
import type { AllExceptLast } from '@/types'
import type { Address } from './types'
import Wei from './entities/Wei'

type AssertExtends<T, U extends T> = 'ok'

export type ContractForLib<A extends AvailableAbi> =
  | {
      lib: 'web3'
      web3: AbiToContract<A, 'web3'>
    }
  | {
      lib: 'ethers'
      ethers: AbiToContract<A, 'ethers'>
    }

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

interface BuiltMethod<CallResult> {
  call: () => Promise<CallResult>
  estimateGas: () => Promise<bigint>
  send: (params: { gas: bigint }) => Promise<void>
}

export class TransactionObject<T> {
  #call: () => Promise<T>
  #estimateGas: () => Promise<bigint>
  #send: (params: { gas: bigint }) => Promise<void>

  public constructor(props: BuiltMethod<T>) {
    this.#call = props.call
    this.#estimateGas = props.estimateGas
    this.#send = props.send
  }

  public call(this: this) {
    return this.#call()
  }

  public estimateGas(this: this) {
    return this.#estimateGas()
  }

  public async send(this: this, params: { gas: bigint }) {
    await this.#send(params)
  }

  public async estimateAndSend(): Promise<void> {
    const gas = await this.estimateGas()
    await this.send({ gas })
  }

  public async estimateAndPrepareSend(): Promise<{ gas: bigint; send: () => Promise<void> }> {
    const gas = await this.estimateGas()
    const send = () => this.send({ gas })
    return { gas, send }
  }
}

interface MethodBuilderProps<A extends AvailableAbi, M extends string> {
  argsEthers: () => GetEthersMethodArgs<A, M>
  argsWeb3: () => GetWeb3MethodArgs<A, M>
  overrides?: IsomorphicOverrides
}

interface MethodBuilder<A extends AvailableAbi, M extends string> {
  (props: MethodBuilderProps<A, M>): TransactionObject<GetCallResult<A, M>>
  (args: GetBothArgs<A, M>, overrides?: IsomorphicOverrides): TransactionObject<GetCallResult<A, M>>
}

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

function normalizeBuilderProps<A extends AvailableAbi, M extends string>(
  propsOrArgs: GetBothArgs<A, M> | MethodBuilderProps<A, M>,
  overrides?: IsomorphicOverrides,
): MethodBuilderProps<A, M> {
  if (Array.isArray(propsOrArgs))
    return {
      overrides,
      argsEthers: () => propsOrArgs,
      argsWeb3: () => propsOrArgs,
    }
  return propsOrArgs
}

export function isomorphicContract<A extends AvailableAbi>(contract: ContractForLib<A>): IsomorphicContract<A> {
  if (contract.lib === 'ethers') {
    const { ethers: x } = contract

    const methods = Object.keys(x.functions)

    return Object.fromEntries(
      methods.map<[string, MethodBuilder<A, any>]>((method) => {
        const builder: MethodBuilder<A, any> = ((propsOrArgs, maybeOverrides) => {
          const { argsEthers: args, overrides } = normalizeBuilderProps(propsOrArgs, maybeOverrides)

          const normOverrides: PayableOverrides & { from?: Address } = {
            from: overrides?.from,
            gasPrice: overrides?.gasPrice?.asBigInt,
            value: overrides?.value?.asBigInt,
          }

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          return new TransactionObject({
            call: async () => {
              const result = await (x as ContractEthers).callStatic[method](...args(), normOverrides)
              return result
            },
            estimateGas: async () => {
              const y = await ((x as ContractEthers).estimateGas[method](
                ...args(),
                normOverrides,
              ) as Promise<BigNumberEthers>)
              return y.toBigInt()
            },
            send: async ({ gas: gasLimit }) => {
              const tx: ContractTransaction = await (x as ContractEthers)[method](...args(), {
                ...normOverrides,
                gasLimit,
              })
              await tx.wait()
            },
          })
        }) as MethodBuilder<A, any>

        return [method, builder]
      }),
    ) as IsomorphicContract<A>
  }

  const { web3: x } = contract

  const methods = Object.keys(x.methods)

  return Object.fromEntries(
    methods.map<[string, MethodBuilder<A, any>]>((method) => {
      const builder: MethodBuilder<A, any> = ((propsOrArgs, maybeOverrides) => {
        const { overrides, argsWeb3: args } = normalizeBuilderProps(propsOrArgs, maybeOverrides)

        const normOverrides: PayableTx = {}
        overrides?.from && (normOverrides.from = overrides.from)
        overrides?.gasPrice && (normOverrides.gasPrice = overrides.gasPrice.asStr)
        overrides?.value && (normOverrides.value = overrides.value.asStr)

        const createTxObject = () => (x as ContractWeb3).methods[method](...args()) as PayableTransactionObject<any>

        return new TransactionObject({
          call: () => createTxObject().call(normOverrides),
          estimateGas: async () => {
            const gas = await createTxObject().estimateGas(normOverrides)
            return BigInt(gas)
          },
          send: async ({ gas }) => {
            await createTxObject().send({ ...normOverrides, gas: gas.toString() })
          },
        })
      }) as MethodBuilder<A, any>

      return [method, builder]
    }),
  ) as IsomorphicContract<A>
}
