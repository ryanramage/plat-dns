const parse = require('fast-json-parse')
const get = require('lodash.get')
const center = require('./center')
const bbox = require('@turf/bbox').default

const Domain = require('./domain')

exports.center = (archive, file, done) => {
  archive.readFile(file, 'utf8', (err, data) => {
    if (err) return done(err)
    let result = parse(data)
    if (result.err) return done(new Error(result.err))
    let geojson = result.value
    let ttl = get(geojson, 'properties.asPoint')
    let specifiedCenter = center(geojson)
    let box = bbox(geojson)
    done(null, {specifiedCenter, geojson, box})
  })
}
