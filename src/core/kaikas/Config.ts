import type BigNumber from 'bignumber.js'
import * as utils from './utils'
import type { DexFactory, DexRouter } from '@/types/typechain/swap'
import type { WETH9 } from '@/types/typechain/tokens/WKLAY.sol'
import Caver, { type AbiItem, type Contract } from 'caver-js'
import { type Klaytn, type Address } from './types'
import { MAGIC_ROUTER_ADDR, MAGIC_FACTORY_ADDR, MAGIC_WETH_ADDR, MAGIC_GAS_PRICE } from './const'
import { ROUTER, FACTORY, WETH } from './smartcontracts/abi'

export default class Config {
  public static async connectKaikas(params?: ConnectParams): Promise<ConnectResult> {
    const { caver, klaytn } = params?.kaikasProvider ?? window

    if (!(caver && klaytn)) {
      return { status: 'kaikas-not-installed' }
    }

    const klaytnAddrs =
      // FIXME remove await?
      await klaytn.enable()

    const selfAddr = klaytnAddrs[0] as Address
    caver.klay.defaultAccount = selfAddr

    const cfgAddrs: Config['addrs'] = {
      self: selfAddr,
      router: params?.addrs?.router ?? MAGIC_ROUTER_ADDR,
      factory: params?.addrs?.factory ?? MAGIC_FACTORY_ADDR,
      weth: params?.addrs?.weth ?? MAGIC_WETH_ADDR,
    }

    return {
      status: 'connected',
      cfg: new Config({
        caver,
        contracts: {
          router: new caver.klay.Contract(ROUTER, cfgAddrs.router) as unknown as DexRouter,
          factory: new caver.klay.Contract(FACTORY, cfgAddrs.factory) as unknown as DexFactory,
          weth: new caver.klay.Contract(WETH, cfgAddrs.weth) as unknown as WETH9,
        },
        addrs: cfgAddrs,
      }),
    }
  }

  public readonly addrs!: Readonly<{
    self: Address
    router: Address

    // FIXME are they needed?
    factory: Address
    weth: Address
  }>

  public readonly contracts!: Readonly<{
    router: DexRouter
    factory: DexFactory
    weth: WETH9
  }>

  public readonly caver!: Caver

  private constructor(data: Pick<Config, 'addrs' | 'contracts' | 'caver'>) {
    Object.assign(this, data)
  }

  public createContract<T>(addr: Address, abi: AbiItem[]) {
    return new this.caver.klay.Contract(abi, addr) as unknown as T
  }

  public async approveAmount(addr: Address, abi: AbiItem[], amountValue: BigNumber.Value) {
    const contract = this.createContract<Contract>(addr, abi)

    const allowanceValue = await contract.methods.allowance(this.addrs.self, this.addrs.router).call({
      from: this.addrs.self,
    })

    const amount = utils.bigNumber(amountValue)
    const allowance = utils.bigNumber(allowanceValue)

    if (amount.isLessThanOrEqualTo(allowance)) return amountValue

    /**
     * FIXME untyped method
     */
    const gas = await contract.methods.approve(this.addrs.router, amountValue).estimateGas()

    return await contract.methods.approve(this.addrs.router, amountValue).send({
      from: this.addrs.self,
      gas,
      gasPrice: MAGIC_GAS_PRICE,
    })
  }
}

interface KaikasProvider {
  caver?: Caver
  klaytn?: Klaytn
}

export interface ConnectParams {
  /**
   * @default window
   */
  kaikasProvider?: KaikasProvider

  addrs?: {
    router?: Address
    factory?: Address
    weth?: Address
  }
}

export type ConnectResult =
  | { status: 'kaikas-not-installed' }
  | {
      status: 'connected'
      cfg: Config
    }
