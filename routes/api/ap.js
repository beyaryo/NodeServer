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
        credential(req, res).then((user) => {
            return Gateway.findOne({code: json.gateway}).exec()
        }).then((gw) => {
            if(!gw) return resSend(res, "Bad gateway code!", undefined, 400)

            return Ap.findOneAndUpdate({
                code: json.code,
                registered: false
            }, {
                $set: {
                    name: json.name,
                    pairedBy: gw.registeredBy,
                    gateway: gw._id,
                    registered: true
                }
            }, {new: true}).populate({
                path: "gateway",
                populate: {
                    path: "accesible",
                    model: "user"
                }
            }).exec()
        }).then((ap) => {
            if(ap) {
                saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> paired`, ap.gateway._id, ap._id)
                resSend(res, "Action point successfully paired!")

                var data = {
                    flag: FCM_AP_PAIR,
                    gateway: ap.gateway.code,
                    code: ap.code,
                    name: ap.name
                }

                ap.gateway.accesible.forEach((user) => {
                    sendNotification(data, user.tokenFirebase)
                })
            }
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    },

    unpair(req, res, next, json){
        credential(req, res).then((user) => {
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
            }, {new: false}).populate({
                path: "gateway",
                populate: {
                    path: "accesible",
                    model: "user"
                }
            }).exec()
        }).then((ap) => {
            if(ap) {
                saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> unpaired`, ap.gateway._id, ap._id)
                resSend(res, "Action point successfully unpaired!")

                var data = {
                    flag: FCM_AP_UNPAIR,
                    gateway: ap.gateway.code,
                    code: ap.code,
                    name: ap.name
                }

                ap.gateway.accesible.forEach((user) => {
                    sendNotification(data, user.tokenFirebase)
                })
            }
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    },

    checkByGateway(req, res, next, json){
        credential(req, res).then((user) => {
            return Gateway.findOne({
                registered: true,
                code: json.gateway
            }).exec()
        }).then((gw) => {
            return Ap.find({
                registered: true,
                gateway: gw._id
            }).exec()
        }).then((aps) => {
            if(aps.length > 0) resSend(res, undefined, aps)
            else resSend(res, "Action point not found!", undefined, 400)
        }).catch(next)
    },

    info(req, res, next, json){
        credential(req, res).then((user) => {
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