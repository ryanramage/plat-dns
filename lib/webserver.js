const express = require('express')
const getgeojson = require('./getgeojson')

module.exports = (config, archiveManager, template) => {
  const app = express()
  app.get('/', (req, resp) => {
    let headers = req.headers
    let domain = req.headers.host
    if (!domain) return resp.end('no domain header found')
    getgeojson(domain, archiveManager, (err, info) => {
      if (err) {
        console.log(err)
        return resp.end('An error occured')
      }
      resp.writeHead(302, { 'Location': template(info) })
      resp.end()
    })
  })

  app.post('/dat/:dat', (req, resp) => {
    let headers = req.headers
    let domain = req.headers.host // much insecure, easy forge
    let dat = req.params.dat
    archiveManager.set(domain, dat)
    resp.send('{"ok": true}')
  })

  app.delete('/dat', (req, resp) => {
    let headers = req.headers
    let domain = req.headers.host // much insecure, easy forge
    archiveManager.remove(domain)
    resp.send('{"ok": true}')
  })

  app.listen(config.httpPort)
  console.log(`WEB server started on port ${config.httpPort}`)
  return app
}
