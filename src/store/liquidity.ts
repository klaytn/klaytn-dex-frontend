import { acceptHMRUpdate, defineStore } from 'pinia'

import { Status } from '@soramitsu-ui/ui'
import type { AbiItem } from 'caver-js'
import kip7 from '@/utils/smartcontracts/kip-7.json'
import pairAbi from '@/utils/smartcontracts/pair.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
import type { Address, Pair, Token } from '@/types'
import { LiquidityStatus } from '@/types'
import type { DexPair } from '@/types/typechain/swap'
import type { KIP7 } from '@/types/typechain/tokens'

interface State {
  liquidityStatus: LiquidityStatus
  pairs: Pair[]
  removeLiquidityPair: {
    lpTokenValue: string | null
    tokenA: Token | null
    tokenB: Token | null
    amount1: string | null
    amount0: string | null
  }
}

export const useLiquidityStore = defineStore('liquidity', {
  state(): State {
    return {
      liquidityStatus: LiquidityStatus.Initial,
      pairs: [],
      removeLiquidityPair: {
        lpTokenValue: null,
        tokenA: null,
        tokenB: null,
        amount1: null,
        amount0: null,
      },
    }
  },
  actions: {
    async quoteForTokenB(value: string) {
      const tokensStore = useTokensStore()
      try {
        const { selectedTokens, computedToken } = tokensStore
        const { tokenA, tokenB } = selectedTokens
        if (tokenA === null || tokenB === null)
          throw new Error('No selected tokens')

        const exchangeRate = await $kaikas.tokens.getTokenBQuote(
          tokenA.address,
          tokenB.address,
          value,
        )

        const { pairBalance, userBalance }
          = await $kaikas.tokens.getPairBalance(
            tokenA.address,
            tokenB.address,
          )

        tokensStore.setTokenValue({ type: computedToken, value: exchangeRate, pairBalance, userBalance })
      }
      catch (e) {
        console.error(e)
        $notify({ status: Status.Error, description: `${e}` })
      }
    },
    async quoteForTokenA(value: string) {
      const tokensStore = useTokensStore()
      try {
        const { selectedTokens, computedToken } = tokensStore
        const { tokenA, tokenB } = selectedTokens
        if (tokenA === null || tokenB === null)
          throw new Error('No selected tokens')

        const exchangeRate = await $kaikas.tokens.getTokenAQuote(
          tokenA.address,
          tokenB.address,
          value,
        )

        const { pairBalance, userBalance }
          = await $kaikas.tokens.getPairBalance(
            tokenA.address,
            tokenB.address,
          )

        tokensStore.setTokenValue({ type: computedToken, value: exchangeRate, pairBalance, userBalance })
      }
      catch (e) {
        console.error(e)
        $notify({ status: Status.Error, description: `${e}` })
      }
    },

    // async quoteForKlay({ commit, rootState: { tokens } }, { value, reversed }) {
    //   try {
    //     const {
    //       selectedTokens: { tokenA, tokenB },
    //       computedToken,
    //     } = tokens;
    //
    //     const exchangeRate = await $kaikas.tokens.getKlayQuote(
    //       tokenA.address,
    //       tokenB.address,
    //       value,
    //       reversed
    //     );
    //
    //     const { pairBalance, userBalance } =
    //       await $kaikas.tokens.getPairBalance(
    //         tokenA.address,
    //         tokenB.address
    //       );
    //
    //     commit(
    //       "tokens/SET_TOKEN_VALUE",
    //       { type: computedToken, value: exchangeRate, pairBalance, userBalance },
    //       { root: true }
    //     );
    //   } catch (e) {
    //     console.log(e);
    //     $notify({ status: Status.Error, description: e });
    //   }
    //   return;
    // },

    async getPairs() {
      const config = useConfigWithConnectedKaikas()

      const pairsCount = await config.factoryContract.methods
        .allPairsLength()
        .call()

      const pairs = await Promise.all(
        new Array(Number(pairsCount)).fill(null).map(async (it, i) => {
          const address = await config.factoryContract.methods
            .allPairs(i)
            .call()

          const pair: {
            address: Address
            symbolA?: string
            symbolB?: string
          } = { address }

          const contract = config.createContract<DexPair>(
            address,
            pairAbi.abi as AbiItem[],
          )

          const addressA = await contract.methods.token0().call()
          const addressB = await contract.methods.token1().call()

          const contractA = config.createContract<KIP7>(
            addressA,
            kip7.abi as AbiItem[],
          )
          const contractB = config.createContract<KIP7>(
            addressB,
            kip7.abi as AbiItem[],
          )

          let name = await contract.methods.name().call()
          const symbol = await contract.methods.symbol().call()

          if (
            !$kaikas.utils.isEmptyAddress(addressA)
            && !$kaikas.utils.isEmptyAddress(addressB)
          ) {
            const symbolA = await contractA.methods.symbol().call()
            const symbolB = await contractB.methods.symbol().call()

            name = `${symbolA} - ${symbolB}`

            pair.symbolA = symbolA
            pair.symbolB = symbolB
          }

          const pairBalance = await contract.methods.totalSupply().call()
          const userBalance = await contract.methods
            .balanceOf(config.address)
            .call()

          const reserves = await contract.methods.getReserves().call()

          return {
            ...pair,
            userBalance,
            pairBalance,
            symbol,
            name,
            reserves,
          }
        }),
      )
      this.pairs = pairs
    },

    async addLiquidityAmountOut() {
      const config = useConfigWithConnectedKaikas()
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      if (tokenA === null || tokenB === null)
        throw new Error('No selected tokens')

      try {
        const tokenAValue = $kaikas.bigNumber(tokenA.value)
        const tokenBValue = $kaikas.bigNumber(tokenB.value)
        const deadLine = Math.floor(Date.now() / 1000 + 300)
        const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100))
        const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100))

        await config.approveAmount(
          tokenA.address,
          kip7.abi as AbiItem[],
          tokenAValue.toFixed(0),
        )

        await config.approveAmount(
          tokenB.address,
          kip7.abi as AbiItem[],
          tokenBValue.toFixed(0),
        )
        const pairAddress = await config.factoryContract.methods
          .getPair(tokenA.address, tokenB.address)
          .call({
            from: this.address,
          })

        if (!$kaikas.isEmptyAddress(pairAddress)) {
          const { send }
            = await $kaikas.liquidity.addLiquidityAmountOutForExistPair({
              tokenAValue,
              tokenBValue,
              tokenAddressA: tokenA.address,
              tokenAddressB: tokenB.address,
              amountAMin,
              deadLine,
            })

          await send()
          $notify({
            status: Status.Success,
            description: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
          })

          return
        }

        const lqGas = await config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            config.address,
            deadLine,
          )
          .estimateGas()

        await config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            config.address,
            deadLine,
          )
          .send({
            gas: lqGas,
            gasPrice: 250000000000,
          })

        $notify({ status: Status.Success, description: 'Liquidity success' })
      }
      catch (e) {
        console.error(e)
        $notify({ status: Status.Error, description: `${e}` })
        throw new Error('Error')
      }
    },
    async addLiquidityAmountIn() {
      const config = useConfigWithConnectedKaikas()

      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      if (tokenA === null || tokenB === null)
        throw new Error('No selected tokens')

      try {
        const tokenAValue = $kaikas.bigNumber(tokenA.value)
        const tokenBValue = $kaikas.bigNumber(tokenB.value)
        const deadLine = Math.floor(Date.now() / 1000 + 300)
        const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100))
        const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100))

        await config.approveAmount(
          tokenA.address,
          kip7.abi as AbiItem[],
          tokenAValue.toFixed(0),
        )
        await config.approveAmount(
          tokenB.address,
          kip7.abi as AbiItem[],
          tokenBValue.toFixed(0),
        )

        const pairAddress = await config.factoryContract.methods
          .getPair(tokenA.address, tokenB.address)
          .call({
            from: this.address,
          })

        if (!$kaikas.utils.isEmptyAddress(pairAddress)) {
          const { send }
            = await $kaikas.liquidity.addLiquidityAmountInForExistPair({
              tokenAValue,
              tokenBValue,
              tokenAddressA: tokenA.address,
              tokenAddressB: tokenB.address,
              amountBMin,
              deadLine,
            })

          await send()
          $notify({
            status: Status.Success,
            description: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
          })

          return
        }

        const lqGas = await config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            config.address,
            deadLine,
          )
          .estimateGas()

        await config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            config.address,
            deadLine,
          )
          .send({
            from: config.address,
            gas: lqGas,
            gasPrice: 250000000000,
          })

        $notify({
          status: Status.Success,
          description: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
        })
      }
      catch (e) {
        console.error(e)
        $notify({ status: Status.Error, description: 'Liquidity error' })
        throw new Error('Error')
      }
    },
    async addLiquidityETH() {
      const config = useConfigWithConnectedKaikas()

      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      if (tokenA === null || tokenB === null)
        throw new Error('No selected tokens')

      const sortedPair = $kaikas.utils.sortKlayPair(tokenA, tokenB)
      const tokenAValue = $kaikas.utils.bigNumber(sortedPair[0].value)
      const tokenBValue = $kaikas.utils.bigNumber(sortedPair[1].value) // KLAY

      const deadLine = Math.floor(Date.now() / 1000 + 300)

      const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100))
      const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100))

      await config.approveAmount(
        sortedPair[0].address,
        kip7.abi as AbiItem[],
        tokenAValue.toFixed(0),
      )

      await config.approveAmount(
        sortedPair[1].address,
        kip7.abi as AbiItem[],
        tokenBValue.toFixed(0),
      )

      const pairAddress = await config.factoryContract.methods
        .getPair(sortedPair[0].address, sortedPair[1].address)
        .call({
          from: config.address,
        })

      if (!$kaikas.utils.isEmptyAddress(pairAddress)) {
        const { send } = await $kaikas.liquidity.addLiquidityKlayForExistsPair({
          tokenAValue,
          tokenBValue,
          amountAMin,
          addressA: sortedPair[0].address,
          deadLine,
        })
        return await send()
      }

      const { send } = await $kaikas.liquidity.addLiquidityKlay({
        addressA: sortedPair[0].address,
        tokenAValue,
        tokenBValue,
        amountAMin,
        amountBMin,
        deadLine,
      })

      return await send()
    },
    async calcRemoveLiquidityAmounts(lpTokenValue: string) {
      const config = useConfigWithConnectedKaikas()

      const tokensStore = useTokensStore()
      const { tokenA, tokenB, pairAddress } = tokensStore.selectedTokens
      if (tokenA === null || tokenB === null || pairAddress === null)
        throw new Error('No selected tokens')

      const pairContract = config.createContract<DexPair>(
        pairAddress,
        pairAbi.abi as AbiItem[],
      )

      const oneBN = $kaikas.utils.bigNumber('1')

      const totalSupply = $kaikas.utils.bigNumber(
        await pairContract.methods.totalSupply().call(),
      )
      const lpToken = $kaikas.utils.bigNumber(
        $kaikas.utils.toWei(lpTokenValue),
      )

      const contract0 = config.createContract<KIP7>(
        tokenA.address,
        kip7.abi as AbiItem[],
      )
      const contract1 = config.createContract<KIP7>(
        tokenB.address,
        kip7.abi as AbiItem[],
      )

      const balance0 = await contract0.methods.balanceOf(pairAddress).call({
        from: config.address,
      })

      const balance1 = await contract1.methods.balanceOf(pairAddress).call({
        from: config.address,
      })

      const amount0 = lpToken
        .multipliedBy(balance0)
        .dividedBy(totalSupply)
        .minus(oneBN)
      const amount1 = lpToken
        .multipliedBy(balance1)
        .dividedBy(totalSupply)
        .minus(oneBN)

      this.removeLiquidityPair = {
        ...this.removeLiquidityPair,
        amount0: amount0.toFixed(0),
        amount1: amount1.toFixed(0),
      }
    },
    async removeLiquidity({ rootState: { liquidity } }) {
      const config = useConfigWithConnectedKaikas()

      const tokensStore = useTokensStore()
      const { selectedTokens } = tokensStore
      const { tokenA, tokenB, pairAddress } = selectedTokens
      if (tokenA === null || tokenB === null || pairAddress == null)
        throw new Error('No selected tokens')

      const { removeLiquidityPair } = liquidity

      // amount0 = (liquidity * balance0) / _totalSupply; // using balances ensures pro-rata distribution
      // amount1 = (liquidity * balance1) / _totalSupply; // using balances ensures pro-rata distribution
      //
      // amountAMin = amount0
      //
      // amountBMin = amount1
      //
      // balance0 = IKIP7(_token0).balanceOf(pairAddress);
      // balance1 = IKIP7(_token1).balanceOf(pairAddress);

      const pairContract = config.createContract<DexPair>(
        pairAddress,
        pairAbi.abi as AbiItem[],
      )

      const oneBN = $kaikas.utils.bigNumber('1')
      const pairBalance = await pairContract.methods
        .balanceOf(pairAddress)
        .call()

      const totalSupply = $kaikas.utils.bigNumber(
        await pairContract.methods.totalSupply().call(),
      )

      const lpToken = $kaikas.utils.bigNumber(
        $kaikas.utils.toWei(removeLiquidityPair.lpTokenValue).toString(),
      )

      await config.approveAmount(
        pairAddress,
        pairAbi.abi as AbiItem[],
        lpToken.toFixed(0),
      )

      const contract0 = config.createContract<KIP7>(
        tokenA.address,
        kip7.abi as AbiItem[],
      )
      const contract1 = config.createContract<KIP7>(
        tokenB.address,
        kip7.abi as AbiItem[],
      )

      const balance0 = await contract0.methods.balanceOf(pairAddress).call({
        from: config.address,
      })

      const balance1 = await contract1.methods.balanceOf(pairAddress).call({
        from: config.address,
      })

      const amount0 = lpToken
        .multipliedBy(balance0)
        .dividedBy(totalSupply)
        .minus(oneBN)
      const amount1 = lpToken
        .multipliedBy(balance1)
        .dividedBy(totalSupply)
        .minus(oneBN)

      const deadLine = Math.floor(Date.now() / 1000 + 300)

      const params = {
        addressA: tokenA.address,
        addressB: tokenB.address,
        lpToken: lpToken.toFixed(0),
        amount0: amount0.minus(oneBN).toFixed(0),
        amount1: amount1.minus(oneBN).toFixed(0),
        address: config.address,
        deadLine,
      }

      try {
        const removeLiqGas = await config.routerContract.methods
          .removeLiquidity(
            params.addressA,
            params.addressB,
            params.lpToken,
            params.amount0,
            params.amount1,
            params.address,
            params.deadLine,
          )
          .estimateGas({
            from: config.address,
            gasPrice: 250000000000,
          })

        await config.routerContract.methods
          .removeLiquidity(
            params.addressA,
            params.addressB,
            params.lpToken,
            params.amount0,
            params.amount1,
            params.address,
            params.deadLine,
          )
          .send({
            from: config.address,
            gasPrice: 250000000000,
            gas: removeLiqGas,
          })
        $notify({
          status: Status.Success,
          description: `Remove liquidity success ${tokenA.name} + ${tokenB.name}`,
        })
      }
      catch (e) {
        console.error(e)
      }
    },
    async removeLiquidityETH() {
      const config = useConfigWithConnectedKaikas()

      const tokensStore = useTokensStore()
      const { selectedTokens } = tokensStore
      const { tokenA, tokenB, pairAddress } = selectedTokens
      if (tokenA === null || tokenB === null || pairAddress === null)
        throw new Error('No selected tokens')

      //   address token, not klay
      //   uint256 liquidity,
      //   uint256 amountTokenMin, // amountTokenMin = (liquidity * balance1) / _totalSupply;
      //   uint256 amountETHMin,   // amountTokenMin = (liquidity * wklayBalance) / _totalSupply;
      //   address to,
      //   uint256 deadline

      const pairContract = config.createContract<DexPair>(
        pairAddress,
        pairAbi.abi as AbiItem[],
      )

      const oneBN = $kaikas.utils.bigNumber('1')

      const pairBalance = await pairContract.methods
        .balanceOf(pairAddress)
        .call()

      const totalSupply = $kaikas.utils.bigNumber(
        await pairContract.methods.totalSupply().call(),
      )

      const lpToken = $kaikas.utils.bigNumber(
        $kaikas.utils.toWei('10'),
      )

      await config.approveAmount(
        pairAddress,
        pairAbi.abi as AbiItem[],
        lpToken.toFixed(0),
      )

      const contract0 = config.createContract<KIP7>(
        tokenA.address,
        kip7.abi as AbiItem[],
      )
      const contract1 = config.createContract<KIP7>(
        tokenB.address,
        kip7.abi as AbiItem[],
      )

      const balance0 = $kaikas.utils.bigNumber(
        await contract0.methods.balanceOf(pairAddress).call({
          from: config.address,
        }),
      )

      const balance1 = $kaikas.utils.bigNumber(
        await contract1.methods.balanceOf(pairAddress).call({
          from: config.address,
        }),
      )

      const amount0 = lpToken
        .multipliedBy(balance0)
        .dividedBy(totalSupply)
        .minus(oneBN)
      const amount1 = lpToken
        .multipliedBy(balance1)
        .dividedBy(totalSupply)
        .minus(oneBN)

      const deadLine = Math.floor(Date.now() / 1000 + 300)

      const params = {
        addressA: tokenA.address,
        addressB: tokenB.address,
        lpToken: lpToken.toFixed(0),
        amount0: amount0.minus(oneBN).toFixed(0),
        amount1: amount1.minus(oneBN).toFixed(0),
        address: config.address,
        deadLine,
      }

      try {
        // - address tokenA,
        // - address tokenB,
        // - uint256 liquidity,
        // - uint256 amountAMin,
        // - uint256 amountBMin,
        // - address to,
        // - uint256 deadline

        const removeLiqGas = await config.routerContract.methods
          .removeLiquidity(
            params.addressA,
            params.addressB,
            params.lpToken,
            params.amount0,
            params.amount1,
            params.address,
            params.deadLine,
          )
          .estimateGas({
            from: config.address,
            gasPrice: 250000000000,
          })

        await config.routerContract.methods
          .removeLiquidity(
            params.addressA,
            params.addressB,
            params.lpToken,
            params.amount0,
            params.amount1,
            params.address,
            params.deadLine,
          )
          .send({
            from: config.address,
            gasPrice: 250000000000,
            gas: removeLiqGas,
          })
      }
      catch (e) {
        console.error(e)
      }
    },
    setRmLiqValue(lpTokenValue: string) {
      this.removeLiquidityPair = {
        ...this.removeLiquidityPair,
        lpTokenValue,
      }
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useLiquidityStore, import.meta.hot))
