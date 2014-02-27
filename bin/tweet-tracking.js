#!/usr/bin/env node
var seaport = require('seaport')
  , dnode = require('dnode')
  , yargs = require('yargs').usage('Usage: $0 -h [host] -p [port] -n [process_name] -w [warning] -c [critical]')
  , args = yargs.options('h', {
                  alias: 'host',
                  describe: 'seaport host',
                  default: 'localhost'
                })
                .options('p', {
                  alias: 'port',
                  describe: 'seaport port',
                  default: 9090
                })
                .options('n', {
                  alias: 'name',
                  describe: 'seaport process name'
                })
                .options('w', {
                  alias: 'warning',
                  describe: 'Tracking keywords warning',
                  default: 450
                })
                .options('c', {
                  alias: 'critical',
                  describe: 'Tracking keywords critical',
                  default: 490
                })
                .options('u', {
                  alias: 'usage',
                  describe: 'Show usage'
                })
                .demand(['n'])
                .argv

if (args.u) {
  yargs.showHelp()
  return process.exit(3)
}

function communicationErr() {
  console.log('Unable to connect to seaport process. Are you sure the process is running?')
  return process.exit(3)
}

var seaport = require('seaport')
  , ports = seaport.connect(args.host, args.port)

var disconnects = 0
ports.on('disconnect', function () {
  if (++disconnects === 3) {
    return communicationErr()
  }
})

setTimeout(function () {
  return communicationErr()
}, 2000)

ports.get(args.name, function (ps) {
  var d = dnode.connect(ps[0].host, ps[0].port)

  d.on('remote', function (remote) {
    remote.tracking(function (err, tracking) {
      if (err) {
        console.log('Unable to fetch tracking keywords.', '[', err.message, ']')
        d.end()
        return process.exit(3)
      }
      var length = tracking.length
        , msg = 'Tracking ' + length + ' keywords!'

      d.end()
      if (length >= args.critical) {
        console.log('CRITICAL!', msg)
        return process.exit(2)
      } else if (length >= args.warning) {
        console.log('WARNING!', msg)
        return process.exit(1)
      } else {
        console.log(msg)
        process.exit(0)
      }
    })
  })
  d.on('error', function (err) {
    console.log('Unable to fetch tracking keywords.', '[', err.message, ']')
    d.end()
    return process.exit(3)
  })
})
