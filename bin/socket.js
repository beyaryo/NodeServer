var Gateway = mongoose.model('gateway')
    Sensor = mongoose.model('sensor')
    Flag = mongoose.model('flag')
    User = mongoose.model('user')
    Ap = mongoose.model('action_point')
    require('./firebase.js')()
    require('./tools.js')()

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
                resolve(User.findOne({token: token}).exec())
            }).then((user) => {
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
            }).then((gw) => {
                if(!gw){
                    callback(503)
                    return null
                }

                gateway = gw
                return Sensor.findOne({gateway: gateway._id}).sort({createdAt:-1}).exec()
            }).then((sensor) => {
                if(!sensor) callback(200, gateway.ip, gateway.bssid, 0, 0, 0, 0, 0, 0)
                else callback(200, gateway.ip, gateway.bssid, sensor.temp, sensor.hum, 
                    sensor.co, sensor.smoke, sensor.bat, sensor.fuzzy);
            }).catch((err) => {
                callback(503)
                print(`Error in client_join ${err.message}`)
            })
        })

        // After gateway connected to server
        // gateway will create room depend on gateway code and update
        // it's ip and bssid
        socket.on('gateway_join', (codeGw, ip, bssid) => {
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
            }).then((gw) => {
                if(!gw) return

                // Check if this device has joined a room before
                if(socket.room) socket.leave(socket.room)

                // Flag to distinguish if this device is gateway
                socket.isGateway = true

                // Create room
                socket.room = gw.code
                socket.join(gw.code)
                saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> connected`, gw._id)

                var data = {
                    flag: FCM_GATEWAY_ON,
                    gateway: gw.code,
                    name: gw.name,
                    ip: ip,
                    bssid: bssid
                }

                sendNotification(data, gw.registeredBy.tokenFirebase)
                gw.accesible.forEach((user) => {
                    sendNotification(data, user.tokenFirebase)
                })
            }).catch((err) => {
                print(`Error in gateway_join ${err.message}`)
            })
        })

        socket.on('gateway_data', (data) => {
            print(`Data from ap => ${data.ap}`)

            new Promise((resolve, reject) => {
                resolve(Ap.findOne({
                    code: data.ap,
                    registered: true
                }).populate("gateway").exec())
            }).then((ap) => {
                if(ap){
                    var sensor = new Sensor()
                    sensor.temp = data.temp
                    sensor.hum = data.hum
                    sensor.co = data.co
                    sensor.co2 = data.co2
                    sensor.bat = data.bat
                    sensor.fuzzy = data.fuzzy
                    sensor.gateway = ap.gateway._id
                    sensor.ap = ap._id
                    sensor.createdAt = new Date()
                    
                    // Save sensor data
                    sensor.save((err) => {
                        if(err) print(`Something went wrong ${err.message}`)
                        else fuzzyAlert(sensor)
                    })
            
                    // Push sensor data to owners of gateway via socket    
                    io.sockets.in(socket.room).emit('sensor_value', sensor, socket.room, ap.code)
        
                    // Check sensor condition
                    isSensorGood(sensor)
                }else{
                    // Save sensor node if node is not registered yet
                    saveSensorNode(socket.room, data.ap)
                }
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
            }).then((gw) => {
                if(gw) saveFlag(FLAG_GATEWAY, `Gateway <b>${gw.name}<b/> disconnected`, gw._id)
            }).catch((err) => {
                print(`Error in disconnect ${err.message}`)
            })
        })
    }

    saveSensorNode = (codeGw, codeAp) => {
        new Promise((resolve, reject) => {
            // Update Gateway
            resolve(Gateway.findOne({code: codeGw, registered: true})
                .populate("registeredBy").exec())
        }).then((gw) => {
            if(!gw) return

            return Ap.findOneAndUpdate({
                code: codeAp,
                registered: false
            }, {
                $set: {
                    name: "Sensor node",
                    pairedBy: gw.registeredBy,
                    gateway: gw._id,
                    registered: true
                }
            }, {new: true}).exec()
        }).then((ap) => {
            if(ap) saveFlag(FLAG_AP, `Action point <b>${ap.name}<b/> paired`, ap.gateway, ap._id)
        }).catch((err) => {
            print(`Error in gateway_data ${err.message}`)
        })
    }

    fuzzyAlert = (sensor) => {
        if(sensor.fuzzy > 63){
            // Do something when fuzzy is high
            checkAlertTime(sensor, 1)
            postToTwitter(sensor)
        }else if(sensor.fuzzy > 40){
            // Do something when fuzzy is medium
            checkAlertTime(sensor, 0)
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
            new Promise((resolve, reject) => {
                resolve(Flag.find({
                    gateway: sensor.gateway,
                    ap: sensor.ap,
                    type: FLAG_SENSOR,
                    createdAt: {$gte: date}
                }).exec())
            }).then((flags) => {
                if(flags.length <= 0){
                    var str = ""

                    for(i=0; i < brokenSensor.length; i++){
                        str += brokenSensor[i]
                        if(i < brokenSensor.length - 1) str += ", "
                    }

                    saveFlag(FLAG_SENSOR, `Your ${str} sensor(s) is not in good condition, please check it`, sensor.gateway, sensor.ap)

                    return Gateway.findById(sensor.gateway)
                        .populate("registeredBy")
                        .populate("accesible").exec()
                }
            }).then((gw) => {
                if(!gw) return

                var data = {
                    flag: FCM_SENSOR_ERROR,
                    gateway: gw.code,
                    name: gw.name
                }

                sendNotification(data, gw.registeredBy.tokenFirebase)
                gw.accesible.forEach((user) => {
                    sendNotification(data, user.tokenFirebase)
                })
            }).catch((err) => {
                print(`Error in isSensorGood ${err.message}`)
            })
        }
    }

    checkAlertTime = (sensor, category) => {
        var date = new Date(), categoryString = "", fcmFlag = "", actionPoint
    
        if(category == 1) {
            // Do something when category dangerous

            // To check if there is flag's
            // contain those criteria within 3 minutes
            date.setMinutes(date.getMinutes() - 3)
            categoryString = "Dangerous"
            fcmFlag = FCM_ALERT_DANGER
        }else {
            // Do something when category warning
            
            // To check if there is flag's
            // contain those criteria within 10 minutes
            date.setMinutes(date.getMinutes() - 10)
            categoryString = "Warning"
            fcmFlag = FCM_ALERT_WARNING
        }

        new Promise((resolve, reject) => {
            resolve(Ap.findById(sensor.ap).populate({
                path: 'gateway',
                populate: [
                    {
                        path: 'registeredBy',
                        model: 'user'
                    },
                    {
                        path: 'accesible',
                        model: 'user'
                    },
                ]
            }).exec())
        }).then((ap) => {
            if(!ap) return
            actionPoint = ap

            return Flag.find({
                gateway: ap.gateway._id,
                ap: ap._id,
                type: FLAG_ALERT,
                additional: category,
                createdAt: {$gte: date}
            }).exec()
        }).then((flags) => {
            if(flags.length <= 0){
                saveFlag(FLAG_ALERT, `Your <b>${actionPoint.gateway.name}</b> is in <b>${categoryString}</b>, please check if something happened!!`, 
                actionPoint.gateway._id, actionPoint._id, category)

                var data = {
                    flag: fcmFlag,
                    gateway: actionPoint.gateway.code,
                    name: actionPoint.gateway.name,
                    fuzzy: `${sensor.fuzzy}`
                }
    
                sendNotification(data, actionPoint.gateway.registeredBy.tokenFirebase)
                actionPoint.gateway.accesible.forEach((user) => {
                    sendNotification(data, user.tokenFirebase)
                })
            }
        }).catch((err) => {
            print(`Error in checkAlertTime ${err.message}`)
        })
    }
}