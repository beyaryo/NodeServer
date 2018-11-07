var router = require('express').Router()
    Ap = mongoose.model('action_point')
    Gateway = mongoose.model('gateway')
    
router.get('/', (req, res, next) => {
    credential(res, req)
    .then((result) => {
        Ap.find({
            registered: true,
            gateway: req.body.gateway
        })
        .then((aps) => {
            returnRes(res, undefined, aps)
        }).catch(next)
    }).catch(next)
})

router.post('/create', (req, res, next) => {
    var ap = new Ap()
    ap.code = req.body.code
    ap.createdAt = new Date()

    ap.save().then(() => {
        returnRes(res, "Action Point successfully created!")
    }).catch(next)
});

router.post('/info', (req, res, next) => {
    credential(res, req)
    .then((result) => {
        Ap.findOne({
            code: req.body.code,
            registered: true
        })
        .then((ap) => {
            if(ap) returnRes(res, undefined, ap)
            else returnRes(res, "Action point not found!", undefined, 400)
        }).catch(next)
    }).catch(next)
})

router.post('/pair', (req, res, next) => {

    credential(res, req)
    .then((result) => {
        return Gateway.findOne({code: req.body.gateway}).exec()
    })
    .then((result) => {
        if(!result) return returnRes(res, "Bad gateway code!", undefined, 400)

        Ap.findOneAndUpdate({
            code: req.body.code,
            registered: false
        }, {
            $set: {
                name: req.body.name,
                pairedBy: result.registeredBy,
                gateway: result.code,
                registered: true
            }
        }, {new: true})
        .then((ap) => {
            if(ap) {
                saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> paired`, result.code, ap.code)
                returnRes(res, "Action point successfully paired!")
            }
            else returnRes(res, "Action point not found!", undefined, 400)
        }).catch(next)
    })
    .catch(next)
})

router.post('/unpair', (req, res, next) => {
    credential(res, req)
    .then((result) => {
        Ap.findOneAndUpdate({
            code: req.body.code,
            registered: true,
            pairedBy: result._id
        }, {
            $set: {
                name: undefined,
                pairedBy: undefined,
                gateway: undefined,
                registered: false
            }
        }, {new: true})
        .then((ap) => {
            if(ap) {
                saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> unpaired`, result.code, ap.code)
                returnRes(res, "Action point successfully unpaired!")
            }
            else returnRes(res, "Action point not found!", undefined, 400)
        }).catch(next)
    }).catch(next)
})

module.exports = router