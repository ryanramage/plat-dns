const async = require('async')
const compact = require('lodash.compact')
const endsWith = require('lodash.endswith')
const geojson = require('./geojson')
const center = require('@turf/center').default
const helpers = require('@turf/helpers')
const bbox = require('@turf/bbox').default
const get = require('lodash.get')


exports.asDomainList = function (config, archive, dirPath, domain, done) {
  archive.readdir(dirPath, (error, list) => {
    if (error) return done(error)
    let collection = compact(list.map(path => {
      if (config.directoryIndex === path) return
      if (endsWith(path, '.json')) {
        let fname = path.split('.')[0]
        return {domain: `${fname}.${domain}`}
      } else {
        return {domain: `${path}.${domain}`}
      }
    }))
    done(null, collection)
  })
}

exports.asDomainListWithGeoInfo = function (config, archive, dirPath, domain, done) {
  archive.readdir(dirPath, (error, list) => {
    if (error) return done(error)
    let points = []
    async.mapLimit(list, 3, (path, cb) => {
      if (config.directoryIndex === path) return cb()
      if (!endsWith(path, '.json')) return cb(null, {domain: `${path}.${domain}`})
      let fname = path.split('.')[0]
      geojson.center(archive, dirPath + path, (err, info) => {
        if (err) return cb(err)
        let child = center(info.geojson)
        child.properties.name = fname
        child.properties.domain = `${fname}.${domain}`
        points.push(child)
        return cb(null, {domain: child.properties.domain, info})
      })
    }, (err, collection) => {
      if (err) return done(err)
      let fc = helpers.featureCollection(points)
      var mid = center(fc)
      var box = bbox(fc)
      var geo = {
        geojson: fc,
        specifiedCenter: get(mid, 'geometry.coordinates').reverse().join(','),
        box
      }
      done(err, compact(collection), geo)
    })
  })
}
