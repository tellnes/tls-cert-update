var track = require('track')
  , crypto = require('crypto')
  , createFileExpirer = require('file-expires')
  , EventEmitter = require('events').EventEmitter
  , extend = require('util')._extend



module.exports = function(options, cb) {
  var files = []
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
      function onfile(buffer) {
        if (isArray) {
          self.options[type][index] = buffer
        } else {
          self.options[type] = buffer
        }
      }

      file = createFileExpirer(file, { cwd: options.cwd }, t(function(err, buffer, cb) {
        if (err) return cb(err)
        onfile(buffer)
        cb()
      }))

      file.on('expires', function() {
        file.readFile(function(err, buffer) {
          if (err) return self.emit('error', err)

          onfile(buffer)
          updateContext()
        })
      })

      files.push(file)
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
  })

  return self
}

