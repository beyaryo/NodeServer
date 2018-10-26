module.exports = () => {
    
    FLAG_GATEWAY = "Gateway"
    FLAG_LOCK = "Lock"
    FLAG_TWITTER = "Twitter"
    FLAG_ALERT = "Alert"
    FLAG_AGGR = "Aggregate"

    print = (message) => { console.log(message) }

    credential = (res, req) => {
        var token = req.get("xap-key")

        if(token == undefined){
            credentialNotValid(res)
            return
        }

        return new Promise((resolve, reject) => {
            mongoose.model('user').findOne({token: token}).then((user) => {
                if(user != null) resolve(user)
                else credentialNotValid(res)
            }).catch((err) => reject(err))
        })
    }

    returnRes = (res, msg, data, code) => {
        if(code == null) code = 200

        res.status(code).json({
            message: msg,
            data: data
        })
    }

    credentialNotValid = (res) => {
        returnRes(res, "Credential is not valid!", undefined, 401)
    }

    saveFlag = (type, desc, additional, gwCode) => {
        mongoose.model('flag').create({
            type: type,
            desc: desc,
            additional: additional,
            gateway: gwCode
        })
    }

    aggregating = () => {
        
        var now = new Date()
        var pipeline = [
            {
                $match: {createdAt: {$lte: now}}
            },
            {
                $group: {
                    _id: "$gateway",
                    temp: {$avg: "$temp"},
                    hum: {$avg: "$hum"},
                    co: {$avg: "$co"},
                    smoke: {$avg: "$smoke"},
                    bat: {$min: "$bat"},
                    fuzzy: {$last: "$fuzzy"}
                }
            }
        ]

        new Promise((resolve, reject) => {
            resolve(mongoose.model('sensor').aggregate(pipeline))
        })
        .then((results) => {
            results.forEach((item) => {
                item.temp = roundNum(item.temp)
                item.hum = roundNum(item.hum)
                item.co = roundNum(item.co)
                item.smoke = roundNum(item.smoke)
                item.bat = roundNum(item.bat)
                var desc = `Temperature : ${item.temp}, Humidity: ${item.hum}, CO : ${item.co}, Smoke : ${item.smoke}, Battery Level : ${item.bat}`

                saveFlag(FLAG_AGGR, desc, item.fuzzy, item._id)
                mongoose.model('sensor').deleteMany({
                    $and: [
                        {gateway : "usa87"},
                        {createdAt : {$lte : now}},
                    ]
                }).exec();
            })
        })
        .catch((err) => {
            console.log(`Error in aggregateByCode ${err.message}`)
        })
    }

    roundNum = (number) => {
        return (Math.round(number * 100)/100).toFixed(2)
    }
}