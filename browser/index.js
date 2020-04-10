const SDK = require('dat-sdk')
const SDKPromise = require('dat-sdk/promise')
const { Hypercore, Hyperdrive, resolveName, deleteStorage, destroy } = SDK()
const geojson = require('../lib/geojson')

__platLive = function (datUrl, active, listener) {

  const archive = Hyperdrive(datUrl)

  function reallyReady (archive, cb) {
    if (archive.metadata.peers.length) {
      archive.metadata.update({ ifAvailable: true }, cb)
    } else {
      archive.metadata.once('peer-add', () => {
        archive.metadata.update({ ifAvailable: true }, cb)
      })
    }
  }
  reallyReady(archive, () => {
    setTimeout(active(), 0)
    archive.on('update', (e) => {
      console.log('update!', e)
      fetch('/fullGeo').then(response => response.json()).then(data => listener(data))
    })
  })
}
