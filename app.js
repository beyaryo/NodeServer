var path = require('path')
    express = require('express')
    parser = require('body-parser')
    mongoose = require('mongoose')

// Models
require('./models/user')
require('./models/gateway')
require('./models/ap')
require('./models/flag')
require('./models/sensor')

var rawBodySaver = function (req, res, buf, encoding) {
    if (buf && buf.length) req.rawBody = buf.toString(encoding || 'utf8')
}

var isProduction = process.env.NODE_ENV === 'production'
var app = express()

// common config
app.use(require('morgan')('dev'))
app.use(parser.json({ verify: rawBodySaver }))
app.use(parser.urlencoded({ verify: rawBodySaver, extended: true }))
app.use(parser.raw({ verify: rawBodySaver, type: function () { return true } }))
app.use(express.static(path.join(__dirname, 'public')))

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// database configuration
if(isProduction){
    // configuration for production
}else{
    // configuration for dev
}

// import all route
app.use(require('./routes'))

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handlers
app.use((err, req, res, next) => {
    // print error when in dev environment
    if(!isProduction) console.log(err.stack)

    res.status(err.status || 500)

    res.json({'errors': {
        message: err.message,
        error: err
    }})
})

module.exports = app