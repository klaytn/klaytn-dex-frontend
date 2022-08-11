import { DexFactory, DexRouter } from './typechain'
import Wallet from './Wallet'

interface Contracts {
  router: DexRouter
  factory: DexFactory
}

export default class BaseContracts implements Readonly<Contracts> {
  public static async load(wallet: Wallet): Promise<BaseContracts> {
    const [router, factory] = await Promise.all([
      wallet.createContract(wallet.routerAddress, 'router'),
      wallet.createContract(wallet.factoryAddress, 'factory'),
    ])

    return new BaseContracts({ router, factory })
  }

  public readonly router!: DexRouter
  public readonly factory!: DexFactory

  private constructor(x: Contracts) {
    Object.assign(this, x)
  }
}
