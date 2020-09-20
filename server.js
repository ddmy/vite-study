const staticParse = require('./middleware/static-parse')
const Koa = require('koa')
const app = new Koa()

app.use(staticParse)

app.listen('9090', () => {
  console.log('listen: localhost:9090')
})