var googleAuth = require('google-auth-library')
    key = require("../firebase.json")
    jwtClient = new googleAuth.JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/firebase.messaging'],
        null
    )
    require('./tools.js')()

module.exports = () => {

    FCM_ACCESS_GAIN = "access-gain"
    FCM_ACCESS_REVOKE = "access-revoke"
    FCM_FAMILY_ADDED = "family-added"
    FCM_FAMILY_REMOVED = "family-removed"
    FCM_AP_PAIR = "ap-paired"
    FCM_AP_UNPAIR = "ap-unpaired"
    FCM_GATEWAY_ON = "gateway-on"
    FCM_ALERT_WARNING = "alert-warning"
    FCM_ALERT_DANGER = "alert-danger"
    FCM_SENSOR_ERROR = "sensor-error"

    ACTION_SETTING = "action-setting"
    ACTION_MAIN = "action-main"

    accessToken = () => {
        return new Promise((resolve, reject) => {
            jwtClient.authorize((err, tokens) => {
                if(err) reject(err)
                else resolve(tokens.access_token)
            })
        })
    }

    sendNotification = (data, token) => {
        print(`The token ${token}`)

        if(!token) return

        var flag = data.flag

        var notification = {}

        if(flag == FCM_ACCESS_GAIN){
            notification.title = `Gateway ${data.name} added`
            notification.body = `Hooray, you gain new access to a gateway ${data.name}, let's check it`
            notification.click_action = ACTION_MAIN
        }else if(flag == FCM_ACCESS_REVOKE){
            notification.title = `${data.name}'s access revoked`
            notification.body = `Too bad, you can no longer access ${data.name}`
            notification.click_action = ACTION_MAIN
        }else if(flag == FCM_FAMILY_ADDED){
            notification.title = "New family added"
            notification.body = `Someone has been gained access to gateway ${data.name}, let's check who's it`
            notification.click_action = ACTION_SETTING
        }else if(flag == FCM_FAMILY_REMOVED){
            notification.title = `A family member removed`
            notification.body = `One of your family member has been revoked from ${data.name}`
            notification.click_action = ACTION_SETTING
        }else if(flag == FCM_AP_PAIR){
            notification.title = `New action point paired`
            notification.body = `Action point ${data.name} has been paired, hooray!!`
            notification.click_action = ACTION_MAIN
        }else if(flag == FCM_AP_UNPAIR){
            notification.title = `An action point unpaired`
            notification.body = `${data.name} has been unpaired from gateway`
            notification.click_action = ACTION_MAIN
        }else if(flag == FCM_GATEWAY_ON){
            notification = undefined
        }else if(flag == FCM_ALERT_WARNING){
            notification.title = `Gateway warning alert`
            notification.body = `Something happen in ${data.name}, go check it now!`
            notification.click_action = ACTION_MAIN
        }else if(flag == FCM_ALERT_DANGER){
            notification = undefined
        }else if(flag == FCM_SENSOR_ERROR){
            notification.title = `Sensor damaged`
            notification.body = `Your sensor in gateway ${data.name} is not right, hurry fix it now!`
            notification.click_action = ACTION_MAIN
        }

        var body = {
            validate_only: false,
            message: {
                token: token,
                android: {
                    priority: 'HIGH',
                    notification: notification,
                    data: data
                }
            }
        }

        accessToken().then((token) => {
            jwtClient.request({
                method: 'POST',
                url: 'https://fcm.googleapis.com/v1/projects/coming-sst/messages:send',
                data: body
            })
        }).catch((err) => {
            print(`Error in send fcm => ${err.message}`)
        })
    }
}