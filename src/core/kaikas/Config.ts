import BigNumber from 'bignumber.js'
import type { DexFactory, DexPair, DexRouter } from '@/types/typechain/swap'
import type { WETH9 } from '@/types/typechain/tokens/WKLAY.sol'
import Caver, { type AbiItem } from 'caver-js'
import { type Klaytn, type Address, ValueWei } from './types'
import { MAGIC_ROUTER_ADDR, MAGIC_FACTORY_ADDR, MAGIC_WETH_ADDR, MAGIC_GAS_PRICE } from './const'
import { ROUTER, FACTORY, WETH, KIP7 as KIP7_ABI } from './smartcontracts/abi'
import { KIP7 } from '@/types/typechain/tokens'

export default class Config {
  public static async connectKaikas(params?: ConnectParams): Promise<ConnectResult> {
    const { caver, klaytn } = params?.kaikasProvider ?? window

    if (!(caver && klaytn)) {
      return { status: 'kaikas-not-installed' }
    }

    const klaytnAddrs = await klaytn.enable()

    const selfAddr = klaytnAddrs[0]
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

  /**
   * Uses KIP7 by default
   */
  public async approveAmount(addr: Address, amountStr: ValueWei<string>): Promise<void> {
    const contract = this.createContract<KIP7>(addr, KIP7_ABI)
    await this.approveAmountWithExistingContract(contract, amountStr)
  }

  public async approveAmountWithExistingContract(contract: KIP7 | DexPair, amountStr: ValueWei<string>): Promise<void> {
    const allowanceStr = await contract.methods.allowance(this.addrs.self, this.addrs.router).call({
      from: this.addrs.self,
    })

    const amountBn = new BigNumber(amountStr)
    const allowanceBn = new BigNumber(allowanceStr)

    if (amountBn.isLessThanOrEqualTo(allowanceBn)) return

    const approveMethod = contract.methods.approve(this.addrs.router, amountStr)

    const gas = await approveMethod.estimateGas()
    await approveMethod.send({
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
