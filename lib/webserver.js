
const compact = require('lodash.compact')
const express = require('express')
const accepts = require('accepts')
const Links = require('./links')
const Domain = require('./domain')
const geojson = require('./geojson')
const Collection = require('./collection')
const Mustache = require('mustache')

module.exports = (config, archiveManager) => {
  const app = express()
  app.get('/', (req, resp) => {
    let headers = req.headers
    let domain = req.headers.host
    archiveManager.findArchive(domain, (archiveError, archive) => {
      let accept = accepts(req)
      switch (accept.type(['json', 'html'])) {
        case 'json': handleJsonRoot(config, archiveError, domain, archive, req, resp); break;
        case 'html': handleHtmlRoot(config, archiveError, domain, archive, req, resp); break;
        default: handleDefaultRoot(config, archiveError, domain, archive, req, resp); break;
      }
    })
  })

  app.get('/collection', (req, resp) => {
    let domain = req.headers.host
    archiveManager.findArchive(domain, (archiveError, archive) => {
      let accept = accepts(req)
      switch (accept.type(['json', 'html'])) {
        case 'json': handleJsonCollectionListing(config, archiveError, domain, archive, req, resp); break;
        case 'html': handleHtmlCollectionListing(config, archiveError, domain, archive, req, resp); break;
        default: handleDefaultCollectionListing(config, archiveError, domain, archive, req, resp); break;
      }
    })
  })


  app.post('/dat/:dat', (req, resp) => {
    let headers = req.headers
    let domain = req.headers.host // much insecure, easy forge
    let dat = req.params.dat
    archiveManager.findArchive(domain, (err, archive) => {
      if (archive) return resp.send('{"ok": false, "reason": "already registered"}')
      archiveManager.set(domain, dat)
      resp.send('{"ok": true}')
    })
  })

  // app.delete('/dat', (req, resp) => {
  //   let headers = req.headers
  //   let domain = req.headers.host // much insecure, easy forge
  //   archiveManager.remove(domain)
  //   resp.send('{"ok": true}')
  // })

  app.listen(config.httpPort)
  console.log(`WEB server started on port ${config.httpPort}`)
  return app
}


const onErrorJson = (error, resp) => resp.status(500).send({error})
const sendDirListingJson = (config, archive, dirPath, domain, resp) => {
  if (config.disableCollectionListing) return resp.status(403).send({ok: false, reason: 'collectionListings is disabled'})
  Collection.asDomainList(config, archive, dirPath, domain, (error, collection) => {
    if (error) return resp.status(404).send({error})
    resp.send({ok: true, collection})
  })
}

function handleJsonRoot (config, archiveError, domain, archive, req, resp) {
  resp.type('application/json')
  if (archiveError) return resp.status(404).send({error: archiveError})
  Domain.mode(archive, domain, (error, info) => {
    if (error) onErrorJson(error, resp)

    resp.set('datKey', archive.key.toString('hex'))
    resp.set('datVersion', archive.version)
    if (info.isCollectionWithIndex) {
      resp.set('datFile', info.isCollectionWithIndex)
      resp.set('collection', 'true')
      return archive.createReadStream(info.isCollectionWithIndex).on('error', err => onErrorJson(err, resp)).pipe(resp)
    } else if (info.isLeaf) {
      resp.set('datFile', info.isLeaf)
      return archive.createReadStream(info.isLeaf).on('error', err => onErrorJson(err, resp)).pipe(resp)
    } else if (info.isCollection) {
      resp.set('datFile', info.isCollection)
      resp.set('collection', 'true')
      return sendDirListingJson(config, archive, info.isCollection, domain, resp)
    }
    resp.status(404).send({error: 'Not found'})
  })
}

function generatePlace (domain) {
  let [name, ...rest] = domain.split('.')
  return {name, domain, parent: rest.join('.')}
}

function handleHtmlRoot (config, archiveError, domain, archive, req, resp) {
  resp.type('text/html')
  if (archiveError) return resp.status(404).send({error: archiveError})
  Domain.mode(archive, domain, (error, info) => {
    if (error) onErrorJson(error, resp)

    resp.set('datKey', archive.key.toString('hex'))
    resp.set('datVersion', archive.version)
    if (info.isCollectionWithIndex) {
      return geojson.center(archive, info.isCollectionWithIndex, (err, geo) => {
        //if (err) return server.send(query)
        let links = Links(geo.specifiedCenter, domain, info.isCollectionWithIndex)
        Collection.asDomainList(config, archive, info.isCollection, domain, (err, collection) => {
          let properties = geojson.allProperties(geo.geojson)
          geo.geojson = JSON.stringify(geo.geojson)
          geo.box = JSON.stringify(geo.box)
          let hasProperties = properties.length
          let hasGeojson = true
          return resp.send(Mustache.render(config.template, {config, place: generatePlace(domain), geo, collection, links, properties, hasProperties, hasGeojson}))
        })
      })

    } else if (info.isLeaf) {
      return geojson.center(archive, info.isLeaf, (err, geo) => {
        //if (err) return server.send(query)
        let links = Links(geo.specifiedCenter, domain, info.isLeaf)
        let properties = geojson.allProperties(geo.geojson)
        geo.geojson = JSON.stringify(geo.geojson)
        geo.box = JSON.stringify(geo.box)
        let hasProperties = properties.length
        let hasGeojson = true
        return resp.send(Mustache.render(config.template, {config, place: generatePlace(domain), geo, links, properties, hasProperties, hasGeojson}))
      })
    } else if (info.isCollection) {
      return Collection.asDomainListWithGeoInfo(config, archive, info.isCollection, domain, (err, collection, geo) => {
        let links = Links(null, domain, info.isCollection)
        let properties = geojson.allProperties(geo.geojson)
        geo.geojson = JSON.stringify(geo.geojson)
        geo.box = JSON.stringify(geo.box)
        let hasProperties = properties.length
        let hasGeojson = false
        return resp.send(Mustache.render(config.template,{config, place: generatePlace(domain), geo, collection, links, properties, hasProperties, hasGeojson}))
      })
    }
    resp.status(404).send('<html><body>Not Found</body></html>')
  })
}

function handleJsonCollectionListing (config, archiveError, domain, archive, req, resp) {
  if (archiveError) return resp.status(404).send({error: archiveError})
  if (config.disableCollectionListing) return resp.status(403).send({ok: false, reason: 'collectionListings is disabled'})
  Domain.mode(archive, domain, (error, info) => {
    if (error) onErrorJson(error, resp)

    resp.set('datKey', archive.key.toString('hex'))
    resp.set('datVersion', archive.version)
    if (info.isCollectionWithIndex) {
      resp.set('datFile', info.isCollection)
      resp.set('collection', 'true')
      return sendDirListingJson(config, archive, info.isCollection, domain, resp)
    } else if (info.isLeaf) {
      // TODO - revisit this case. WEIRD
      resp.set('datFile', info.isLeaf)
      return resp.send({ok: true, collection: []})
    } else if (info.isCollection) {
      resp.set('datFile', info.isCollection)
      resp.set('collection', 'true')
      return sendDirListingJson(config, archive, info.isCollection, domain, resp)
    }
    resp.status(404).send({error: 'Not found'})
  })

}
