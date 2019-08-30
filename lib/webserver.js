const endsWith = require('lodash.endswith')
const compact = require('lodash.compact')
const express = require('express')
const accepts = require('accepts')
const Domain = require('./domain')
const geojson = require('./geojson')
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

function getCollection (config, archive, dirPath, domain, done) {
  console.log(dirPath)
  archive.readdir(dirPath, (error, list) => {
    if (error) return done(error)
    let collection = compact(list.map(l => {
      if (config.directoryIndex === l) return
      if (endsWith(l, '.json')) {
        let fname = l.split('.')[0]
        return `${fname}.${domain}`
      } else {
        return `${l}.${domain}`
      }
    }))
    done(null, collection)
  })
}

const onErrorJson = (error, resp) => resp.status(500).send({error})
const sendDirListingJson = (config, archive, dirPath, domain, resp) => {
  if (config.disableCollectionListing) return resp.status(403).send({ok: false, reason: 'collectionListings is disabled'})
  getCollection(archive, dirPath, domain, (err, collection) => {
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
  let [name] = domain.split('.')
  return {name, domain}
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
        getCollection(config, archive, info.isCollection, domain, (err, collection) => {
          geo.geojson = JSON.stringify(geo.geojson)
          geo.box = JSON.stringify(geo.box)
          return resp.send(Mustache.render(config.template, {config, place: generatePlace(domain), geo, collection}))
        })
      })

    } else if (info.isLeaf) {
      return geojson.center(archive, info.isLeaf, (err, geo) => {
        //if (err) return server.send(query)
        geo.geojson = JSON.stringify(geo.geojson)
        geo.box = JSON.stringify(geo.box)        
        return resp.send(Mustache.render(config.template, {config, place: generatePlace(domain), geo}))
      })
    } else if (info.isCollection) {
      return getCollection(config, archive, info.isCollection, domain, (err, collection) => {
        let geo =  {}

        return resp.send(Mustache.render(config.template,{config, place: generatePlace(domain), geo, collection}))
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
