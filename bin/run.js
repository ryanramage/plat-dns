#!/usr/bin/env node
const level = require('level')

const DNSServer = require('../lib/dnsserver')
const WebServer = require('../lib/webserver')

const config = require('rc')('flapto', require('../options.json'))
const template = require('lodash.template')(config.redirect)

const db = level(config.dbdir)
const ArchiveManager = require('../lib/archiveManager')

const archiveManager = new ArchiveManager(config, db)
archiveManager.init(() => {
  let dnsServer = null
  if (!config.disableDnsServer) dnsServer = DNSServer(config, archiveManager)

  let webServer = null
  if (!config.disableWebServer) webServer = WebServer(config, archiveManager, template)
})
