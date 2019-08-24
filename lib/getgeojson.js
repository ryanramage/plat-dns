const parse = require('fast-json-parse')
const get = require('lodash.get')
const center = require('./center')

module.exports = (domain, archiveManager, done) => {
  if (!domain) return done(new Error('no domain provided'))
  archiveManager.findArchive(domain, (err, archive) => {
    if (err) return done(err)
    let file = `/${domain}`
    archive.readFile(file, 'utf8', (err, data) => {
      if (err) return done(err)
      let result = parse(data)
      if (result.err) return done(new Error(result.err))
      let geojson = result.value
      let ttl = get(geojson, 'properties.asPoint')
      let specifiedCenter = center(geojson)

      done(null, {specifiedCenter, geojson})
    })
  })
}
