var track = require('track')
  , crypto = require('crypto')
  , createFileExpirer = require('file-expires')
  , EventEmitter = require('events').EventEmitter
  , extend = require('util')._extend



module.exports = function(options, cb) {
  var files = []
    , t = track()
    , self = new EventEmitter

  if (cb) {
    function onready() {
      self.removeListener('error', onerror)
      cb(null, self.options)
    }
    function onerror(err) {
      self.removeListener('ready', onready)
      cb(err)
      self.destroy()
    }
    self.once('ready', onready)
    self.once('error', onerror)
  }

  self.options = extend({}, options)

  self.options.SNICallback = function() {
    return self.secureContext
  }


  function updateContext() {
    self.secureContext = crypto.createCredentials(self.options).context
    self.emit('update')
  }

  self.destroy = function() {
    files.forEach(function(file) {
      file.destroy()
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


    value.forEach(function(file, index) {
      file = createFileExpirer(file)
      function update(cb) {
        if (!cb) cb = updateContext

        file.readFile(function(err, buffer) {
          if (err) return self.emit('error', err)

          if (isArray) {
            self.options[type][index] = buffer
          } else {
            self.options[type] = buffer
          }

          cb()
        })
      }
      file.on('expires', update)
      update(t())
      files.push(file)
    })
  }


  prepare('key')
  prepare('cert')
  prepare('ca')
  prepare('crl')


  t.end(function(err) {
    t = null
    if (err) return self.emit('error', err)

    updateContext()
    self.emit('ready')
  })

  return self
}

