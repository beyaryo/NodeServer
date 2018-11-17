var router = require('express').Router()
    user = require('./user')
    gateway = require('./gateway')
    ap = require('./ap')
    require('../../bin/tools.js')()

router.post('/', (req, res, next) => {
    var json = JSON.parse(req.rawBody)
    var data = json.data

    if(!json){
        next(err)
        return
    }

    switch(json["module"]){
        // For user process
        case "RegisterCheck": user.registerCheck(req, res, next, data)
            break
        case "Register": user.register(req, res, next, data)
            break
        case "Login": user.login(req, res, next, data)
            break
        case "CheckMe": user.checkMe(req, res, next, data)
            break
        case "Logout": user.logout(req, res, next, data)
            break

        // For gateway process
        case "GatewayCreate": gateway.create(req, res, next, data)
            break
        case "GatewayRegister": gateway.register(req, res, next, data)
            break
        case "GatewayMe": gateway.checkMe(req, res, next, data)
            break
        case "GatewayInfo": gateway.info(req, res, next, data)
            break
        case "GatewayGrant": gateway.grant(req, res, next, data)
            break
        case "GatewayRevoke": gateway.revoke(req, res, next, data)
            break

        // For action point process
        case "ApCreate": ap.create(req, res, next, data)
            break
        case "ApPair": ap.pair(req, res, next, data)
            break
        case "ApUnpair": ap.unpair(req, res, next, data)
            break
        case "ApCheckByGateway": ap.checkByGateway(req, res, next, data)
            break
        case "ApInfo": ap.info(req, res, next, data)
            break

        // default case
        default: next(err)
            break
    }
})

module.exports = router;