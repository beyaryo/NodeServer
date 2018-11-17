var Ap = mongoose.model('action_point')
    Gateway = mongoose.model('gateway')

module.exports = {
    create(req, res, next, json){
        var ap = new Ap()
        ap.code = json.code
        ap.createdAt = new Date()

        ap.save().then(() => {
            resSend(res, "Action Point successfully created!")
        }).catch(next)
    },

    pair(req, res, next, json){
        var gwCode = ""

        credential(req, res)
        .then((user) => {
            return Gateway.findOne({code: json.gateway}).exec()
        })
        .then((gw) => {
            if(!gw) return resSend(res, "Bad gateway code!", undefined, 400)
            gwCode = gw.code

            return Ap.findOneAndUpdate({
                code: json.code,
                registered: false
            }, {
                $set: {
                    name: json.name,
                    pairedBy: gw.registeredBy,
                    gateway: gw.code,
                    registered: true
                }
            }, {new: true}).exec()
        })
        .then((ap) => {
            if(ap) {
                saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> paired`, gwCode, ap.code)
                resSend(res, "Action point successfully paired!")
            }
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    },

    unpair(req, res, next, json){
        credential(req, res)
        .then((user) => {
            return Ap.findOneAndUpdate({
                code: json.code,
                registered: true,
                pairedBy: user._id
            }, {
                $set: {
                    name: undefined,
                    pairedBy: undefined,
                    gateway: undefined,
                    registered: false
                }
            }, {new: true}).exec()
        }).then((ap) => {
            if(ap) {
                saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> unpaired`, undefined, ap.code)
                resSend(res, "Action point successfully unpaired!")
            }
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    },

    checkByGateway(req, res, next, json){
        credential(req, res)
        .then((user) => {
            return Ap.find({
                registered: true,
                gateway: json.gateway
            }).exec()
        }).then((aps) => {
            if(aps.length > 0) resSend(res, undefined, aps)
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    },

    info(req, res, next, json){
        credential(req, res)
        .then((user) => {
            return Ap.findOne({
                code: json.code,
                registered: true
            }).exec()
        }).then((ap) => {
            if(ap) resSend(res, undefined, ap)
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    }
}