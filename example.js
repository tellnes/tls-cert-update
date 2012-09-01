var tcu = require('./')

tcu ( { ca: [ 'http://s3-eu-west-1.amazonaws.com/files.infogym.no/ca/root.crt'
            , 'http://s3-eu-west-1.amazonaws.com/files.infogym.no/ca/monitors.crt'
            ]
      , crl:[ 'https://s3-eu-west-1.amazonaws.com/files.infogym.no/ca/root.crl'
            , 'https://s3-eu-west-1.amazonaws.com/files.infogym.no/ca/monitors.crl'
            ]
      }
    , function(err, options) {
        if (err) throw err
        console.log(options)
      }
    )

