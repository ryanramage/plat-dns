#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const level = require('level')
const Mustache = require('mustache')

const DNSServer = require('../lib/dnsserver')
const WebServer = require('../lib/webserver')
const config = require('rc')('flapto', require('../options.json'))
config.template = fs.readFileSync(path.resolve(config.htmlTemplate)).toString()
console.log(config.template)
Mustache.parse(config.template)
const db = level(config.dbdir)
const ArchiveManager = require('../lib/archiveManager')

const archiveManager = new ArchiveManager(config, db)
archiveManager.init(() => {
  let dnsServer = null
  if (!config.disableDnsServer) dnsServer = DNSServer(config, archiveManager)

  let webServer = null
  if (!config.disableWebServer) webServer = WebServer(config, archiveManager)
})
