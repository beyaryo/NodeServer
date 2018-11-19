module.exports = () => {
    
    FLAG_GATEWAY = "Gateway"
    FLAG_AP = "AP"
    FLAG_TWITTER = "Twitter"
    FLAG_ALERT = "Alert"
    FLAG_AGGR = "Aggregate"
    FLAG_SENSOR = "Sensor"

    print = (message) => { console.log(message) }

    credential = (req, res) => {
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

    resSend = (res, msg, data, code) => {
        if(code == null) code = 200

        var response = JSON.stringify({
            message: msg,
            data: data
        })

        res.status(code).send(response)
    }

    credentialNotValid = (res) => {
        resSend(res, "Credential is not valid!", undefined, 401)
    }

    saveFlag = (type, desc, _idGateway, _idAp, additional) => {
        mongoose.model('flag').create({
            type: type,
            desc: desc,
            gateway: _idGateway,
            ap: _idAp,
            additional: additional,
            createdAt: new Date()
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
                    _id: "$ap",
                    gw: {$last: "$gateway"},
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
        }).then((results) => {
            results.forEach((item) => {
                if(!item.gw) return

                item.temp = roundNum(item.temp)
                item.hum = roundNum(item.hum)
                item.co = roundNum(item.co)
                item.smoke = roundNum(item.co2)
                item.bat = roundNum(item.bat)
                var desc = `Temperature : ${item.temp}, Humidity: ${item.hum}, CO : ${item.co}, CO2 : ${item.co2}, Battery Level : ${item.bat}`

                saveFlag(FLAG_AGGR, desc, item.gw, item.ap, item.fuzzy)

                mongoose.model('sensor').deleteMany({
                    $and: [
                        {gateway : item.gw},
                        {createdAt : {$lte : now}},
                    ]
                }).exec();
            })

            // Delete all data in collection Flag
            // with undefinied gateway value
            mongoose.model('flag').deleteMany({gateway: undefined}).exec()
        }).catch((err) => {
            print(`Error in aggregateByCode ${err.message}`)
        })
    }

    roundNum = (number) => {
        return (Math.round(number * 100)/100).toFixed(2)
    }

    postToTwitter = (sensor) => {
        var yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        new Promise((resolve, reject) => {
            resolve(mongoose.model('flag').find({
                gateway: sensor.gateway,
                type: FLAG_TWITTER,
                createdAt: {$gte: yesterday}
            }).exec())
        }).then((flags) => {
            if(flags.length <= 0) {
                return mongoose.model('gateway').findById(sensor.gateway).exec()
            }
        }).then((gw) => {
            if(!gw) return

            if(gw.lat == null || gw.lat == 0) return

            var message = `Fire happened on '${gw.addr}', Coordinat ${gw.lat}, ${gw.lng}`

            // Do post to twitter here

            // Save twitter flag
            mongoose.model('flag').create({
                type: FLAG_TWITTER,
                desc: message,
                gateway: sensor.gateway,
                ap: sensor.ap,
                createdAt: new Date()
            })
        })
        .catch((err) => {
            print(`Error in postToTwitter ${err.message}`)
        })
    }
}