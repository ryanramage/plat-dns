const named = require('mname')
const getgeojson = require('./getgeojson')

module.exports = (config, archiveManager) => {
  const server = named.createServer()
  server.listen(config.dnsPort, config.host, () => console.log(`DNS server started on port ${config.dnsPort}`))
  server.on('query', query => {
    let domain = query.name()
    let type = query.type()
    if (type === 'A') {
      query.addAnswer(domain, new named.ARecord(config.httpIP), config.ttl)
      return server.send(query)
    }
    if (type !== 'TXT') return server.send(query)
    let datkey = archiveManager.datKey(domain)
    getgeojson(domain, archiveManager, (err, info) => {
      if (err) {
        console.log(err)
        return server.send(query)
      }
      query.addAnswer(domain, new named.TXTRecord(`datkey=${datkey};l=${info.specifiedCenter}`), config.ttl)
      server.send(query)
    })
  })
  return server
}
