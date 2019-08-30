const named = require('mname')
const geojson = require('./geojson')
const Domain = require('./domain')

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
    archiveManager.findArchive(domain, (archiveError, archive) => {
      if (archiveError) {
        console.log(`${domain} findArchive failed. ${archiveError}`)
        return server.send(query)
      }
      Domain.mode(archive, domain, (error, info) => {
        if (error) {
          console.log(`${domain} mode failed. ${error}`)
          return server.send(query)
        }
        let datkey = archive.key.toString('hex')
        if (info.isCollectionWithIndex) {
          return geojson.center(archive, info.isCollectionWithIndex, (err, info) => {
            if (err) {
              console.log(err)
              return server.send(query)
            }
            query.addAnswer(domain, new named.TXTRecord(`plat=true;collection=true;datkey=${datkey};l=${info.specifiedCenter}`), config.ttl)
            server.send(query)
          })
        } else if (info.isLeaf) {
          return geojson.center(archive, info.isLeaf, (err, info) => {
            if (err) {
              console.log(err)
              return server.send(query)
            }
            query.addAnswer(domain, new named.TXTRecord(`plat=true;datkey=${datkey};l=${info.specifiedCenter}`), config.ttl)
            server.send(query)
          })
        } else if (info.isCollection) {
          query.addAnswer(domain, new named.TXTRecord(`plat=true;collection=true;datkey=${datkey}`), config.ttl)
          return server.send(query)
        }
        return server.send(query) // default, not found
      })
    })
  })
  return server
}
