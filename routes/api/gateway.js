var router = require('express').Router()
    Gateway = mongoose.model('gateway')
    
router.get('/', (req, res, next) => {
    credential(res, req)
    .then((result) => {
        Gateway.find({
            registered: true,
            $or: [
                { registeredBy: result._id },
                { accesible: { $in: [result._id] } }
            ]
        })
        .populate("registeredBy")
        .populate("accesible")
        .then((gws) => {
            returnRes(res, undefined, gws)
        }).catch(next)
    }).catch(next)
})

router.post('/create', (req, res, next) => {
    var gw = new Gateway()
    gw.code = req.body.code
    gw.createdAt = new Date()

    gw.save().then(() => {
        returnRes(res, "Gateway successfully created!")
    }).catch(next)
});

router.post('/register', (req, res, next) => {
    credential(res, req)
    .then((result) => {
        Gateway.findOneAndUpdate({
            code: req.body.code,
            registered: false
        }, { 
            $set: {
                name: req.body.name,
                lat: req.body.lat,
                lng: req.body.lng,
                addr: req.body.addr,
                registered: true,
                registeredBy: result._id
            }
        }, {new:true})
        .then((gw) => {
            if(gw) {
                saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> registered`, gw.code)
                returnRes(res, "Gateway successfully registered!")
            }
            else returnRes(res, "Gateway has been registered!", undefined, 400)
        }).catch(next)
    }).catch(next)
});

router.post('/info', (req, res, next) => {
    credential(res, req)
    .then((result) => {
        Gateway.findOne({
            code: req.body.code,
            registered: true
        })
        .populate("registeredBy")
        .populate("accesible")
        .then((gw) => {
            if(gw) returnRes(res, undefined, gw.toJSONDetail())
            else returnRes(res, "Gateway not found!", undefined, 400)
        }).catch(next)
    }).catch(next)
});

router.post('/grant', (req, res, next) => {
    var registeredBy = ""

    credential(res, req)
    .then((result) => {
        registeredBy = result._id
        return User.findOne({ email: req.body.email }).exec()
    })
    .then((result) => {
        if(result == null) return returnRes(res, "User not found!", undefined, 400)

        Gateway.findOneAndUpdate({
            code: req.body.code,
            registered: true,
            registeredBy: registeredBy,
            accesible: { $ne: result._id }
        }, {
            $addToSet: {accesible: result._id}
        }).then((gw) => {
            if(gw) {
                saveFlag(FLAG_GATEWAY, `User <b>${result.email}</b> have been granted permission`, gw.code)
                returnRes(res, "Permission granted")
            }
            else returnRes(res, "User has been granted permission", undefined, 400)
        }).catch(next)
    }).catch(next)
})

router.post('/revoke', (req, res, next) => {
    var registeredBy = ""

    credential(res, req)
    .then((result) => {
        registeredBy = result._id
        return User.findOne({ email: req.body.email }).exec()
    })
    .then((result) => {
        if(result == null) return returnRes(res, "User not found!", undefined, 400)
        
        Gateway.findOneAndUpdate({
            code: req.body.code,
            registered: true,
            registeredBy: registeredBy,
            accesible: { $in: [result._id] }
        }, {
            $pull: {accesible: result._id}
        }).then((gw) => {
            if(gw){
                saveFlag(FLAG_GATEWAY, `User <b>${result.email}</b> permission's revoked`, gw.code)
                returnRes(res, "Permission revoked")
            }
            else returnRes(res, "User does not has permission", undefined, 400)
        }).catch(next)
    }).catch(next)
})

module.exports = router