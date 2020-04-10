const parse = require('fast-json-parse')
const get = require('lodash.get')
const center = require('./center')
const bbox = require('@turf/bbox').default

exports.center = (archive, file, done) => {
  console.log('before read file', file)
  archive.readFile(file, 'utf8', (err, data) => {
    console.log(err, data)
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

exports.allProperties = (geojson) => {
  let allProperties = []
  let featureProps = get(geojson, 'properties', {})
  addProperties(featureProps, allProperties)
  get(geojson, 'features', []).forEach(f => addProperties(get(f, 'properties', {}), allProperties))
  return allProperties
}

function addProperties(obj, allProperties) {
  Object.keys(obj).forEach(key =>  {
    let value = obj[key]
    allProperties.push({key, value})
  })
}
