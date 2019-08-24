const SDK = require('dat-sdk')
const { Hypercore, Hyperdrive, resolveName, deleteStorage, destroy } = SDK()



module.exports = dats => Object.keys(dats).map(key => Hyperdrive(dats[key]))
