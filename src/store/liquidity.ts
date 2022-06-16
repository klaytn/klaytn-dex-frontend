import { acceptHMRUpdate, defineStore } from 'pinia'

import kip7 from '@/utils/smartcontracts/kip-7.json'
import pairAbi from '@/utils/smartcontracts/pair.json'
import config from '@/utils/kaikas/Config'

export const useLiquidityStore = defineStore('liquidity', {
  state() {
    return {
      liquidityStatus: 'init',
      pairs: [],
      test: [342342],
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
    async quoteForTokenB(value) {
      const tokensStore = useTokensStore()
      try {
        const {
          selectedTokens: { tokenA, tokenB },
          computedToken,
        } = tokensStore

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
        console.log(e)
        $notify({ type: 'error', text: e })
      }
    },
    async quoteForTokenA(value) {
      const tokensStore = useTokensStore()
      try {
        const {
          selectedTokens: { tokenA, tokenB },
          computedToken,
        } = tokensStore

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
        console.log(e)
        $notify({ type: 'error', text: e })
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
    //     this.$notify({ type: "error", text: e });
    //   }
    //   return;
    // },

    async getPairs() {
      const pairsCount = await $kaikas.config.factoryContract.methods
        .allPairsLength()
        .call()

      const pairs = await Promise.all(
        new Array(Number(pairsCount)).fill(null).map(async (it, i) => {
          const pair = {}

          const address = await $kaikas.config.factoryContract.methods
            .allPairs(i)
            .call()

          pair.address = address

          const contract = $kaikas.config.createContract(
            address,
            pairAbi.abi,
          )

          const addressA = await contract.methods.token0().call()
          const addressB = await contract.methods.token1().call()

          const contractA = $kaikas.config.createContract(
            addressA,
            kip7.abi,
          )
          const contractB = $kaikas.config.createContract(
            addressB,
            kip7.abi,
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
            .balanceOf($kaikas.config.address)
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
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      try {
        const tokenAValue = $kaikas.bigNumber(tokenA.value)
        const tokenBValue = $kaikas.bigNumber(tokenB.value)
        const deadLine = Math.floor(Date.now() / 1000 + 300)
        const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100))
        const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100))

        await $kaikas.config.approveAmount(
          tokenA.address,
          kip7.abi,
          tokenAValue.toFixed(0),
        )

        await $kaikas.config.approveAmount(
          tokenB.address,
          kip7.abi,
          tokenBValue.toFixed(0),
        )
        const pairAddress = await $kaikas.config.factoryContract.methods
          .getPair(tokenA.address, tokenB.address)
          .call({
            from: this.address,
          })

        if (!$kaikas.isEmptyAddress(pairAddress)) {
          const { gas, send }
            = await $kaikas.liquidity.addLiquidityAmountOutForExistPair({
              pairAddress,
              tokenAValue,
              tokenBValue,
              tokenAddressA: tokenA.address,
              tokenAddressB: tokenB.address,
              amountAMin,
              deadLine,
            })

          await send()
          $notify({
            type: 'success',
            text: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
          })

          console.log('addLiquidityAmountOutForExistPair ', gas)
          return
        }

        const lqGas = await $kaikas.config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            $kaikas.config.address,
            deadLine,
          )
          .estimateGas()

        const lq = await $kaikas.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            $kaikas.config.address,
            deadLine,
          )
          .send({
            gas: lqGas,
            gasPrice: 250000000000,
          })

        console.log({ lq })
        $notify({ type: 'success', text: 'Liquidity success' })
      }
      catch (e) {
        console.log(e)
        $notify({ type: 'error', text: e })
        throw 'Error'
      }
    },
    async addLiquidityAmountIn() {
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens

      try {
        const tokenAValue = $kaikas.bigNumber(tokenA.value)
        const tokenBValue = $kaikas.bigNumber(tokenB.value)
        const deadLine = Math.floor(Date.now() / 1000 + 300)
        const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100))
        const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100))

        await $kaikas.config.approveAmount(
          tokenA.address,
          kip7.abi,
          tokenAValue.toFixed(0),
        )
        await $kaikas.config.approveAmount(
          tokenB.address,
          kip7.abi,
          tokenBValue.toFixed(0),
        )

        const pairAddress = await $kaikas.config.factoryContract.methods
          .getPair(tokenA.address, tokenB.address)
          .call({
            from: this.address,
          })

        if (!$kaikas.utils.isEmptyAddress(pairAddress)) {
          const { gas, send }
            = await $kaikas.liquidity.addLiquidityAmountInForExistPair({
              pairAddress,
              tokenAValue,
              tokenBValue,
              tokenAddressA: tokenA.address,
              tokenAddressB: tokenB.address,
              amountBMin,
              deadLine,
            })

          await send()
          $notify({
            type: 'success',
            text: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
          })

          return
        }

        const lqGas = await $kaikas.config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            $kaikas.config.address,
            deadLine,
          )
          .estimateGas()

        const lq = await $kaikas.config.routerContract.methods
          .addLiquidity(
            tokenA.address,
            tokenB.address,
            tokenAValue.toFixed(0),
            tokenBValue.toFixed(0),
            amountAMin.toFixed(0),
            amountBMin.toFixed(0),
            $kaikas.config.address,
            deadLine,
          )
          .send({
            from: config.address,
            gas: lqGas,
            gasPrice: 250000000000,
          })

        console.log({ lq })
        $notify({
          type: 'success',
          text: `Liquidity success ${tokenA.name} + ${tokenB.name}`,
        })
      }
      catch (e) {
        console.log(e)
        $notify({ type: 'error', text: 'Liquidity error' })
        throw 'Error'
      }
    },
    async addLiquidityETH() {
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens

      const sortedPair = $kaikas.utils.sortKlayPair(tokenA, tokenB)
      const tokenAValue = $kaikas.utils.bigNumber(sortedPair[0].value)
      const tokenBValue = $kaikas.utils.bigNumber(sortedPair[1].value) // KLAY

      const deadLine = Math.floor(Date.now() / 1000 + 300)

      const amountAMin = tokenAValue.minus(tokenAValue.dividedToIntegerBy(100))
      const amountBMin = tokenBValue.minus(tokenBValue.dividedToIntegerBy(100))

      await $kaikas.config.approveAmount(
        sortedPair[0].address,
        kip7.abi,
        tokenAValue.toFixed(0),
      )

      await $kaikas.config.approveAmount(
        sortedPair[1].address,
        kip7.abi,
        tokenBValue.toFixed(0),
      )

      const pairAddress = await $kaikas.config.factoryContract.methods
        .getPair(sortedPair[0].address, sortedPair[1].address)
        .call({
          from: config.address,
        })

      if (!$kaikas.utils.isEmptyAddress(pairAddress)) {
        const { send }
          = await $kaikas.liquidity.addLiquidityKlayForExistsPair({
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
    async calcRemoveLiquidityAmounts(lpTokenValue) {
      const tokensStore = useTokensStore()
      const { selectedTokens } = tokensStore
      const pairAddress = selectedTokens.pairAddress
      const pairContract = $kaikas.config.createContract(
        pairAddress,
        pairAbi.abi,
      )

      const oneBN = $kaikas.utils.bigNumber('1')

      const totalSupply = $kaikas.utils.bigNumber(
        await pairContract.methods.totalSupply().call(),
      )
      const lpToken = $kaikas.utils.bigNumber(
        $kaikas.utils.toWei(lpTokenValue),
      )

      const contract0 = $kaikas.config.createContract(
        selectedTokens.tokenA.address,
        kip7.abi,
      )
      const contract1 = $kaikas.config.createContract(
        selectedTokens.tokenB.address,
        kip7.abi,
      )

      const balance0 = await contract0.methods.balanceOf(pairAddress).call({
        from: $kaikas.config.address,
      })

      const balance1 = await contract1.methods.balanceOf(pairAddress).call({
        from: $kaikas.config.address,
      })

      const amount0 = lpToken
        .multipliedBy(balance0)
        .dividedBy(totalSupply)
        .minus(oneBN)
      const amount1 = lpToken
        .multipliedBy(balance1)
        .dividedBy(totalSupply)
        .minus(oneBN)

      console.log({
        amount0: amount0.toFixed(0),
        amount1: amount1.toFixed(0),
      })

      this.removeLiquidityPair = {
        ...this.removeLiquidityPair,
        amount0: amount0.toFixed(0),
        amount1: amount1.toFixed(0),
      }
    },
    async removeLiquidity({ rootState: { tokens, liquidity } }) {
      const tokensStore = useTokensStore()
      const { selectedTokens } = tokensStore
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

      const pairAddress = selectedTokens.pairAddress
      const pairContract = $kaikas.config.createContract(
        pairAddress,
        pairAbi.abi,
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

      await $kaikas.config.approveAmount(
        pairAddress,
        pairAbi.abi,
        lpToken.toFixed(0),
      )

      const contract0 = $kaikas.config.createContract(
        selectedTokens.tokenA.address,
        kip7.abi,
      )
      const contract1 = $kaikas.config.createContract(
        selectedTokens.tokenB.address,
        kip7.abi,
      )

      const balance0 = await contract0.methods.balanceOf(pairAddress).call({
        from: $kaikas.config.address,
      })

      const balance1 = await contract1.methods.balanceOf(pairAddress).call({
        from: $kaikas.config.address,
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
        addressA: selectedTokens.tokenA.address,
        addressB: selectedTokens.tokenB.address,
        lpToken: lpToken.toFixed(0),
        amount0: amount0.minus(oneBN).toFixed(0),
        amount1: amount1.minus(oneBN).toFixed(0),
        address: $kaikas.config.address,
        deadLine,
      }

      try {
        const removeLiqGas = await $kaikas.config.routerContract.methods
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
            from: $kaikas.config.address,
            gasPrice: 250000000000,
          })

        const res = await $kaikas.config.routerContract.methods
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
            from: $kaikas.config.address,
            gasPrice: 250000000000,
            gas: removeLiqGas,
          })
        $notify({
          type: 'success',
          text: `Remove liquidity success ${selectedTokens.tokenA.name} + ${selectedTokens.tokenB.name}`,
        })
        console.log({ removeLiqGas, res })
      }
      catch (e) {
        console.log(e)
      }
    },
    async removeLiquidityETH() {
      const tokensStore = useTokensStore()
      const { selectedTokens } = tokensStore

      //   address token, not klay
      //   uint256 liquidity,
      //   uint256 amountTokenMin, // amountTokenMin = (liquidity * balance1) / _totalSupply;
      //   uint256 amountETHMin,   // amountTokenMin = (liquidity * wklayBalance) / _totalSupply;
      //   address to,
      //   uint256 deadline

      const pairAddress = selectedTokens.pairAddress
      const pairContract = $kaikas.config.createContract(
        pairAddress,
        pairAbi.abi,
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

      await $kaikas.config.approveAmount(
        pairAddress,
        pairAbi.abi,
        lpToken.toFixed(0),
      )

      const contract0 = $kaikas.config.createContract(
        selectedTokens.tokenA.address,
        kip7.abi,
      )
      const contract1 = $kaikas.config.createContract(
        selectedTokens.tokenB.address,
        kip7.abi,
      )

      const balance0 = $kaikas.utils.bigNumber(
        await contract0.methods.balanceOf(pairAddress).call({
          from: $kaikas.config.address,
        }),
      )

      const balance1 = $kaikas.utils.bigNumber(
        await contract1.methods.balanceOf(pairAddress).call({
          from: $kaikas.config.address,
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
        addressA: selectedTokens.tokenA.address,
        addressB: selectedTokens.tokenB.address,
        lpToken: lpToken.toFixed(0),
        amount0: amount0.minus(oneBN).toFixed(0),
        amount1: amount1.minus(oneBN).toFixed(0),
        address: $kaikas.config.address,
        deadLine,
      }

      console.log({
        ...params,
        totalSupply: totalSupply.toFixed(0),
        balance0: balance0.toFixed(0),
        balance1: balance1.toFixed(0),
        pairBalance,
        amount0N: amount0.toFixed(0),
        amount1N: amount1.toFixed(0),
      })

      try {
        // - address tokenA,
        // - address tokenB,
        // - uint256 liquidity,
        // - uint256 amountAMin,
        // - uint256 amountBMin,
        // - address to,
        // - uint256 deadline

        const removeLiqGas = await $kaikas.config.routerContract.methods
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
            from: $kaikas.config.address,
            gasPrice: 250000000000,
          })

        const res = await $kaikas.config.routerContract.methods
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
            from: $kaikas.config.address,
            gasPrice: 250000000000,
            gas: removeLiqGas,
          })

        console.log({ removeLiqGas, res })
      }
      catch (e) {
        console.log(e)
      }
    },
    setRmLiqValue(lpTokenValue) {
      this.removeLiquidityPair = {
        ...this.removeLiquidityPair,
        lpTokenValue,
      }
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useLiquidityStore, import.meta.hot))
