const express = require("express")
const app = express()

const token = require("./token")
app.use(token)

if (require.main === module) {
  const port = 3001
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`)
  })
}

module.exports = app
