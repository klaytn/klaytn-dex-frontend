const { Router } = require('express')
const router = Router()

router.get('/token', (req, res) => {
  const mockedTokens = ['ETH', 'KLAY', 'DAI', 'BUSD']
  res.end(JSON.stringify(mockedTokens))
})

module.exports = router
