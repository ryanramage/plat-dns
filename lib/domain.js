const async = require('async')
exports.asLeaf = domain => '/' + domain.split('.').reverse().join('/') + '.json'
exports.asCollection = domain => '/' + domain.split('.').reverse().join('/') + '/'
exports.asCollectionWithIndex = domain => '/' + domain.split('.').reverse().join('/') + '/index.json'

exports.mode = (archive, domain, done) => {
  async.parallel({
    isCollectionWithIndex: cb => {
      let file = exports.asCollectionWithIndex(domain)
      archive.stat(file, (err, stat) => {
        if (stat && stat.isFile()) return cb(null, file)
        return cb(null, false)
      })
    },
    isLeaf: cb => {
      let file = exports.asLeaf(domain)
      archive.stat(file, (err, stat) => {
        if (stat && stat.isFile()) return cb(null, file)
        return cb(null, false)
      })
    },
    isCollection: cb => {
      let file = exports.asCollection(domain)
      archive.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) return cb(null, file)
        return cb(null, false)
      })
    }
  }, done)
}
