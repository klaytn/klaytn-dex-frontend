const {Router} = require('express')
const axios = require('axios');
const router = Router()

router.get('/list-tokens', (req, res) => {
  const ids = [18839, 8296, 16676, 18371, 18255, 7881, 12906, 5644, 8766, 18839]
  const mockedTokens = [
    '0xb9920BD871e39C6EF46169c32e7AC4C698688881',
    '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a',
    '0x2486A551714F947C386Fe9c8b895C2A6b3275EC9',
    '0xAFea7569B745EaE7AB22cF17c3B237c3350407A1',
    '0xC20A9eB22de0C6920619aDe93A11283C2a07273e',
    '0xce77229fF8451f5791ef4Cc2a841735Ed4edc3cA',
    '0xFbcb69f52D6A08C156c543Dd4Dc0521F5F545755',
    '0x7cB550723972d7F29b047D6e71b62DcCcAF93992',
    '0xcdBD333BDBB99bC80D77B10CCF74285a97150E5d',
    '0x246C989333Fa3C3247C7171F6bca68062172992C'
  ]

  const reqData = mockedTokens.reduce((acc, it, key) => {
    acc.push({
      address: it,
      id: ids[key]
    })
    return acc
  }, [])

  res.end(JSON.stringify(reqData))
})
router.get('/token-info', async (req, res) => {
  try {
    const cointInfo = await axios.get(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/info`, {
      headers: {
        "X-CMC_PRO_API_KEY": "c3bd9683-eed1-47dc-803f-267d28df3226"
      },
      params: req.query
    })
    res.end(JSON.stringify(cointInfo.data))
  } catch (e) {
    console.log(req.query)
    res.status(400)
    res.end(e.message)
  }
})
router.get('/currency-rate', async (req, res) => {
  try {
    const cointInfo = await axios.get(`https://pro-api.coinmarketcap.com/v1/tools/price-conversion`, {
      headers: {
        "X-CMC_PRO_API_KEY": "c3bd9683-eed1-47dc-803f-267d28df3226"
      },
      params: req.query
    })
    res.end(JSON.stringify(cointInfo.data))
  } catch (e) {
    console.log(req.query)
    res.status(400)
    res.end(e.message)
  }
})
module.exports = router
