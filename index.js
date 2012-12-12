var track = require('track')
  , crypto = require('crypto')
  , fileExpires = require('file-expires')
  , EventEmitter = require('events').EventEmitter
  , extend = require('util')._extend
  , path = require('path')


var cache = {}

module.exports = function(options, cb) {
  var fes = []
    , t = track()
    , self = new EventEmitter

  if (!cb) cb = function(err) {
    if (err) self.emit('error', err)
  }

  self.options = extend({}, options)

  self.options.SNICallback = function() {
    return self.secureContext
  }


  function updateContext() {
    self.secureContext = crypto.createCredentials(self.options).context
    self.emit('update')
  }

  function onerror(err) {
    self.emit('error', err)
  }

  self.destroy = function() {
    fes.forEach(function(item) {
      var fe = item.fe
      fe.ref--
      fe.removeListener('error', onerror)
      fe.removeListener('expires', item.onexpires)

      if (!fe.ref) {
        delete cache[fe.uri]
        fe.destroy()
      }
    })
  }

  function prepare(type) {
    var value = options[type]
      , isArray = false

    if (!value || Buffer.isBuffer(value)) return


    if (Array.isArray(value)) {
      self.options[type] = []
      isArray = true
    } else {
      self.options[type] = null
      value = [value]
    }


    value.forEach(function(uri, index) {
      var fe

      function onfile(buffer) {
        if (isArray) {
          self.options[type][index] = buffer
        } else {
          self.options[type] = buffer
        }
      }

      function onexpires() {
        fe.readFile(function(err, buffer) {
          if (err) return self.emit('error', err)
          onfile(buffer)
          updateContext()
        })
      }

      if (!fileExpires.isURL(uri) && options.cwd) uri = path.resolve(options.cwd, uri)

      fe = cache[uri]
      if (!fe) {
        fe = fileExpires(uri)
        cache[uri] = fe
        fe.ref = 0
      }

      fe.ref++

      fe.readFile(t(function(err, buffer, cb) {
        if (err) return cb(err)
        onfile(buffer)
        cb()
      }))

      fe.on('expires', onexpires)
      fe.on('error', onerror)

      fes.push({ fe: fe, onexpires: onexpires })
    })
  }


  prepare('key')
  prepare('cert')
  prepare('ca')
  prepare('crl')


  t.end(function(err) {
    t = null
    if (err) return cb(err)

    updateContext()
    cb(null, self.options)
    self.emit('ready')
  })

  return self
}

