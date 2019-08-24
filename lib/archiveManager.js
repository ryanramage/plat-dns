const SDK = require('dat-sdk')
const { Hypercore, Hyperdrive, resolveName, deleteStorage, destroy } = SDK()
const rootDomain = require('./rootDomain')

function ArchiveManager (config, db) {
  this.config = config
  this.db = db
  this.archives = {}
}

ArchiveManager.prototype.init = function (done) {
  this.db.createReadStream().on('data', data => {
    let _rootDomain = data.key
    let datUrl = data.value
    this.archives[_rootDomain] = Hyperdrive(datUrl)
    console.log('add root domain', _rootDomain, 'with dat', datUrl)
  }).on('end', done)
}

ArchiveManager.prototype.datKey = function (domain) {
  let _rootDomain = rootDomain(domain)
  let archive = this.archives[_rootDomain]
  if (!archive) return null
  return archive.key.toString('hex')
}

ArchiveManager.prototype.findArchive = function (domain, done) {
  let _rootDomain = rootDomain(domain)
  let archive = this.archives[_rootDomain]
  if (!archive) return done(new Error('domain not available'))
  return done(null, archive)
}

ArchiveManager.prototype.set = function (domain, dat) {
  let datUrl = dat
  if (datUrl.indexOf('dat://') !== 0) datUrl = `dat://${dat}`
  let _rootDomain = rootDomain(domain)
  this.archives[_rootDomain] = Hyperdrive(datUrl)
  this.db.put(_rootDomain, datUrl)
  console.log('add root domain', _rootDomain, 'with dat', datUrl)
}

ArchiveManager.prototype.remove = function (domain) {
  let _rootDomain = rootDomain(domain)
  let archive = this.archives[rootDomain]
  if (!archive) return
  this.db.del(_rootDomain)
  archive.close(err => {
    if (err) console.log('Error closing archive', _rootDomain)
    deleteStorage(archive.key, (e) => {
      console.log('removed root domain', _rootDomain)
    })
  })

}

module.exports = ArchiveManager
