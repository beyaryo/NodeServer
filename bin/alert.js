var Gateway = mongoose.model('gateway')
    User = mongoose.model('user')
    Flag = mongoose.model('flag')
    require('./tools.js')()

module.exports = () => {
    checkAlertTime = (codeGateway, codeAP, category, fuzzyVal) => {
        var date = new Date(), categoryString, gateway
    
        if(category == 1) {
            // Do something when category dangerous

            // To check if there is flag's
            // contain those criteria within 3 minutes
            date.setMinutes(date.getMinutes() - 3)
            categoryString = "Dangerous"
        }else {
            // Do something when category warning
            
            // To check if there is flag's
            // contain those criteria within 10 minutes
            date.setMinutes(date.getMinutes() - 10)
            categoryString = "Warning"
        }

        new Promise((resolve, reject) => {
            resolve(Flag.find({
                gateway: codeGateway,
                type: FLAG_ALERT,
                additional: category,
                createdAt: {$gte: date}
            }).exec())
        })
        .then((flags) => {
            if(flags.length <= 0) return Gateway.findOne({code: codeGateway})
            .populate("registeredBy")
            .populate("accesible").exec()
        })
        .then((gw) => {
            if(gw) {
                gateway = gw

                saveFlag(FLAG_ALERT, `Your <b>${gw.name}</b> is in <b>${categoryString}</b>, please check if something happened!!`, 
                gateway.code, codeAP, category)

                return User.findOne({email: gw.registeredBy.email}).exec()
            }
        })
        .then((master) => {
            if(!master) return

            var data = {fuzzy: fuzzyVal, category: categoryString},
                flag = "ALERT_SENSOR"

            sendNotif(JSON.stringify(data), flag, master.tokenFirebase, gateway.code)

            gateway.accesible.forEach((accesor) => {
                User.findOne({email: accesor.email}).then((user) => {
                    sendNotif(JSON.stringify(data), flag, user.tokenFirebase, gateway.code)
                })
            })
        })
        .catch((err) => {
            print(`Error in checkAlertTime ${err.message}`)
        })
    }

    sendNotif = (data, flag, token, codeGateway) => {
        if(!token) return
        
        print(`This is send notif ${flag} to ${token}`)
    }
}