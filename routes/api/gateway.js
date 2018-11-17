var Gateway = mongoose.model('gateway')

module.exports = {
    create(req, res, next, json){
        var gw = new Gateway()
        gw.code = json.code
        gw.createdAt = new Date()

        gw.save().then(() => {
            resSend(res, "Gateway successfully created!")
        }).catch(next)
    },

    register(req, res, next, json){
        credential(req, res)
        .then((user) => {
            return Gateway.findOneAndUpdate({
                code: json.code,
                registered: false
            }, { 
                $set: {
                    name: json.name,
                    lat: json.lat,
                    lng: json.lng,
                    addr: json.addr,
                    registered: true,
                    registeredBy: user._id
                }   
            }, {new:true}).exec()
        })
        .then((gw) => {
            if(gw) {
                saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> registered`, gw.code)
                resSend(res, "Gateway successfully registered!")
            }
            else resSend(res, "Gateway has been registered!", undefined, 400)
        }).catch(next)
    },

    checkMe(req, res, next, json){
        credential(req, res)
        .then((user) => {
            return Gateway.find({
                registered: true,
                $or: [
                    { registeredBy: user._id },
                    { accesible: { $in: [user._id] } }
                ]
            })
            .populate("registeredBy")
            .populate("accesible").exec()
        }).then((gws) => {
            if(gws.length > 0) resSend(res, undefined, gws)
            else resSend(res, "Gateway not found", undefined, 400)
        }).catch(next)
    },

    info(req, res, next, json){
        credential(req, res)
        .then((user) => {
            return Gateway.findOne({
                code: json.code,
                registered: true
            })
            .populate("registeredBy")
            .populate("accesible").exec()
        }).then((gw) => {
            if(gw) resSend(res, undefined, gw.toJSONDetail())
            else resSend(res, "Gateway not found!", undefined, 400)
        }).catch(next)
    },

    grant(req, res, next, json){
        var registeredBy = "", email = ""

        credential(req, res)
        .then((user) => {
            registeredBy = user._id
            return User.findOne({ email: json.email }).exec()
        })
        .then((user) => {
            if(user == null) return resSend(res, "User not found!", undefined, 400)
            email = user.email

            return Gateway.findOneAndUpdate({
                code: json.code,
                registered: true,
                registeredBy: registeredBy,
                accesible: { $ne: user._id }
            }, {
                $addToSet: {accesible: user._id}
            }).exec()
        }).then((gw) => {
            if(gw) {
                saveFlag(FLAG_GATEWAY, `User <b>${email}</b> have been granted permission`, gw.code)
                resSend(res, "Permission granted")
            }
            else resSend(res, "User has been granted permission", undefined, 400)
        }).catch(next)
    },

    revoke(req, res, next, json){
        var registeredBy = "", email = ""

        credential(req, res)
        .then((user) => {
            registeredBy = user._id
            return User.findOne({ email: json.email }).exec()
        })
        .then((user) => {
            if(user == null) return resSend(res, "User not found!", undefined, 400)
            email = user.email
            
            return Gateway.findOneAndUpdate({
                code: json.code,
                registered: true,
                registeredBy: registeredBy,
                accesible: { $in: [user._id] }
            }, {
                $pull: {accesible: user._id}
            }).exec()
        }).then((gw) => {
            if(gw){
                saveFlag(FLAG_GATEWAY, `User <b>${email}</b> permission's revoked`, gw.code)
                resSend(res, "Permission revoked")
            }
            else resSend(res, "User does not has permission", undefined, 400)
        }).catch(next)
    }
}