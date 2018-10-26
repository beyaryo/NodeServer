var Gateway = mongoose.model('gateway')
    require('./tools.js')()

module.exports = () => {
    handleSocket = (socket) => {
        socket.on('gateway_join', (codeGw, ip, bssid) => {
            new Promise((resolve, reject) => {
                resolve(Gateway.findOneAndUpdate({
                    code: codeGw,
                    registered: true
                }, {
                    $set: {
                        ip: ip,
                        bssid: bssid
                    }
                }, {new: true}).exec())
            })
            .then((gw) => {
                if(!gw) return

                saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> connected`, undefined, codeGw)
            })
        })
    }

    dummy = (gatewayCode) => {
        var sensor = new Sensor()
        sensor.temp = randomInt(0, 100)
        sensor.hum = randomInt(0, 100)
        sensor.co = randomInt(0, 100)
        sensor.smoke = randomInt(0, 100)
        sensor.bat = randomInt(0, 100)
        sensor.fuzzy = randomInt(0, 100)
        sensor.gateway = gatewayCode
        gatewayData(sensor)
    }

    gatewayData = (data) => {
        var sensor = new Sensor()
        sensor.temp = data.temp
        sensor.hum = data.hum
        sensor.co = data.co
        sensor.smoke = data.smoke
        sensor.bat = data.bat
        sensor.fuzzy = data.fuzzy
        sensor.gateway = data.gateway

        sensor.save((err) => {
            if(err) print(`Something went wrong ${err.message}`)
            else {
                var category = fuzzyCategory(sensor.fuzzy)
            }
        })
    }

    fuzzyCategory = (value) => {
        if(value <= 40) return 0;
        else if(value <= 63) return 1;
        else return 2;
    }

    randomInt = (min, max) => {
        return Math.floor(Math.random()*(max-min+1)+min)
    }
}