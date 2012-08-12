# TLS Cert Update

Reads files used by tls from disk or http and updates them when they expires.

This is done by using the `SNICallback` in tls.

For local files `fs.watch` is used and for remote http files we look at the http cache headers. Look at [file-expires](https://github.com/tellnes/file-expires) for details.


## Usage
```js
var tcu = require('tls-cert-update')
  , tls = require('tls')

tcu ( { key: '/path/to/key',
      , cert: '/path/to/cert',
      , ca: [ 'http://ca.example.com/my-root-ca.crt'
            , 'http://ca.example.com/my-other-ca.crt'
            ]
      , crl:[ 'http://ca.example.com/my-root-ca.crl'
            , 'http://ca.example.com/my-other-ca.crl'
            ]
      }
    , function(err, options) {
        if (err) throw err

        tls.createServer(options, function(socket) {
          socket.pipe(socket)
        })
      }
    )
```

## Install

    npm install tls-cert-update

## Licence

MIT
