var Gateway = mongoose.model('gateway')
    Sensor = mongoose.model('sensor')
    Flag = mongoose.model('flag')
    User = mongoose.model('user')
    Ap = mongoose.model('action_point')
    require('./tools.js')()
    require('./alert.js')()

module.exports = () => {
    /**
     * Handle socket data flow
     */
    handleSocket = (io, socket) => {

        // After client connected to server
        // client will join room depend on gateway code
        socket.on('client_join', (token, room, callback) => {
            var gateway

            new Promise((resolve, reject) => {
                resolve(mongoose.model('user').findOne({token: token}).exec())
            })
            .then((user) => {
                if(!user){
                    callback(401)
                    return null
                }

                // Check if this device has joined a room before
                if(socket.room) socket.leave(socket.room)

                // Create room
                socket.room = room
                socket.join(room)

                return Gateway.findOne({code: room}).exec()
            })
            .then((gw) => {
                if(!gw){
                    callback(503)
                    return null
                }

                gateway = gw
                return Sensor.findOne({gateway: gateway.code}).sort({createdAt:-1}).exec()
            })
            .then((sensor) => {
                if(!sensor) callback(200, gateway.ip, gateway.bssid, 0, 0, 0, 0, 0, 0)
                else callback(200, gateway.ip, gateway.bssid, sensor.temp, sensor.hum, 
                    sensor.co, sensor.smoke, sensor.bat, sensor.fuzzy);
            })
            .catch((err) => {
                callback(503)
                print(`Error in client_join ${err.message}`)
            })
        })

        // After gateway connected to server
        // gateway will create room depend on gateway code and update
        // it's ip and bssid
        socket.on('gateway_join', (codeGw, ip, bssid) => {
            var gateway

            new Promise((resolve, reject) => {
                // Update Gateway
                resolve(Gateway.findOneAndUpdate({
                    code: codeGw,
                    registered: true
                }, {
                    $set: {
                        ip: ip,
                        bssid: bssid
                    }
                }, {new: true})
                .populate("registeredBy")
                .populate("accesible").exec())
            })
            .then((gw) => {
                if(!gw) return

                gateway = gw
                // Check if this device has joined a room before
                if(socket.room) socket.leave(socket.room)

                // Flag to distinguish if this device is gateway
                socket.isGateway = true

                // Create room
                socket.room = codeGw
                socket.join(codeGw)
                saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> connected`, codeGw)

                return User.findOne({email: gw.registeredBy.email}).exec()
            })
            .then((master) => {
                if(!master) return

                var data = {ip: ip, bssid: bssid},
                    flag = "GATEWAY_ON"
    
                sendNotif(JSON.stringify(data), flag, master.tokenFirebase, codeGw)
    
                gateway.accesible.forEach((accesor) => {
                    User.findOne({email: accesor.email}).then((user) => {
                        sendNotif(JSON.stringify(data), flag, user.tokenFirebase, codeGw)
                    })
                })
            })
            .catch((err) => {
                print(`Error in gateway_join ${err.message}`)
            })
        })

        socket.on('gateway_data', (data) => {
            var sensor = new Sensor()
            sensor.temp = data.temp
            sensor.hum = data.hum
            sensor.co = data.co
            sensor.co2 = data.co2
            sensor.bat = data.bat
            sensor.fuzzy = data.fuzzy
            sensor.gateway = socket.room
            sensor.ap = data.ap
            sensor.createdAt = new Date()
            
            // Push sensor data to owners of gateway via socket    
            io.sockets.in(socket.room).emit('sensor_value', sensor);

            // Save sensor data
            sensor.save((err) => {
                if(err) print(`Something went wrong ${err.message}`)
                else fuzzyAlert(sensor)
            })

            // Check sensor condition
            isSensorGood(sensor)

            // Check if sensor node paired
            new Promise((resolve, reject) => {
                // Update Gateway
                resolve(Ap.findOne({code: sensor.ap, registered: false}).exec())
            })
            .then((ap) => {
                if(!ap) return

                return Gateway.findOne({code: sensor.gateway, registered: true})
                    .populate("registeredBy").exec()
            })
            .then((gw) => {
                if(!gw) return

                // Register sensor node
                Ap.findOneAndUpdate({
                    code: sensor.ap,
                    registered: false
                }, {
                    $set: {
                        name: "Sensor node",
                        pairedBy: gw.registeredBy,
                        gateway: gw.code,
                        registered: true
                    }
                }, {new: true})
                .then((ap) => {
                    if(ap) saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> paired`, ap.gateway, ap.code)
                })
            })
            .catch((err) => {
                print(`Error in gateway_data ${err.message}`)
            })
        })

        socket.on('disconnect', () => {
            if(socket.room) socket.leave(socket.room);
            if(!socket.isGateway) return

            new Promise((resolve, reject) => {
                resolve(Gateway.findOne({
                    code: socket.room,
                    registered: true
                }).exec())
            })
            .then((gw) => {
                if(!gw) return

                saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> disconnected`, socket.room)
            })
            .catch((err) => {
                print(`Error in disconnect ${err.message}`)
            })
        })
    }

    fuzzyAlert = (sensor) => {
        if(sensor.fuzzy > 63){
            // Do something when fuzzy is high
            checkAlertTime(sensor.gateway, sensor.ap, 1, sensor.fuzzy);
            postToTwitter(sensor);
        }else if(sensor.fuzzy > 40){
            // Do something when fuzzy is medium
            checkAlertTime(sensor.gateway, sensor.ap, 0, sensor.fuzzy);
        }else{
            // Do something when fuzzy is low
        }
    }

    isSensorGood = (sensor) => {
        var date = new Date()
            brokenSensor = []
        
        // To check if there is flag's
        // contain those criteria within a day
        date.setDate(date.getDate() - 1)

        if(sensor.temp < 0 || sensor.temp > 100) brokenSensor.push("temperature")
        if(sensor.hum < 0 || sensor.hum > 100) brokenSensor.push("humidity")
        if(sensor.co < 0 || sensor.co > 100) brokenSensor.push("CO")
        if(sensor.co2 < 0 || sensor.co2 > 100) brokenSensor.push("CO2")

        if(brokenSensor.length > 0){
            Flag.find({
                gateway: sensor.gateway,
                type: FLAG_SENSOR,
                createdAt: {$gte: date}
            })
            .then((flags) => {
                if(flags.length <= 0){
                    var str = ""

                    for(i=0; i < brokenSensor.length; i++){
                        str += brokenSensor[i]
                        if(i < brokenSensor.length - 1) str += ", "
                    }

                    saveFlag(FLAG_SENSOR, `Your ${str} sensor(s) is not in good condition, please check it`, sensor.gateway, sensor.ap)
                }
            })
            .catch((err) => {
                print(`Error in isSensorGood ${err.message}`)
            })
        }
    }

    randomInt = (min, max) => {
        return Math.floor(Math.random()*(max-min+1)+min)
    }
}