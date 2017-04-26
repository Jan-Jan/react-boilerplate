/* eslint consistent-return:0 */

const express = require('express')
const http = require('http')
const logger = require('./logger')

const argv = require('minimist')(process.argv.slice(2))
const setup = require('./middlewares/frontend')
const isDev = process.env.NODE_ENV !== 'production'
const ngrok = (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel ? require('ngrok') : false
const resolve = require('path').resolve
const app = express()
const server = http.Server(app)

// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// app.use('/api', myApi);
const sessionMiddlware = require('./middlewares/session')
if (process.env.NODE_ENV === 'production') {
  // if cookie is secure, then allow trust of proxy on production
  app.set('trust proxy', 1)
}
app.use(sessionMiddlware)

const io = require('./middlewares/socket')(server)

io.on('connection', socket => {
  console.warn('connection made') // eslint-disable-line
  socket.emit('event', {
    type: `SocketConnected`,
    payload: {},
  })
})

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
})

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST
const host = customHost || null // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost'

const port = argv.port || process.env.PORT || 3000

// Start your app.
server.listen(port, host, (err) => {
  if (err) {
    return logger.error(err.message)
  }

  // Connect to ngrok in dev mode
  if (ngrok) {
    ngrok.connect(port, (innerErr, url) => {
      if (innerErr) {
        return logger.error(innerErr)
      }

      logger.appStarted(port, prettyHost, url)
    })
  } else {
    logger.appStarted(port, prettyHost)
  }
})
