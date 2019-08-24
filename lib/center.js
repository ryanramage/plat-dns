const get = require('lodash.get')
const center = require('@turf/center').default

module.exports = geojson => {
  let specifiedCenter = get(geojson, 'features[0].properties.asPoint')
  if (specifiedCenter) return specifiedCenter

  let c = center(geojson)
  specifiedCenter = get(c, 'geometry.coordinates').reverse().join(',')
  return specifiedCenter
}
