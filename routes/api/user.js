var User = mongoose.model('user')

module.exports = {
    registerCheck(req, res, next, json){
        var key = undefined, value = undefined
        var code = 200

        if(json.phone != undefined){
            key = "phone"
            value = json.phone
        }else if(json.email != undefined){
            key = "email"
            value = json.email
        }else{
            return resSend(res, "Bad Request!", undefined, 400)
        }

        User.findOne({[key]: value}).then((user) => {
            key = key.charAt(0).toUpperCase() + key.slice(1)

            if(!user){
                msg = `${key} available!`
            }else{
                msg = `${key} has been taken!`
                code = 400
            }
            
            resSend(res, msg, undefined, code)
        }).catch(next)
    },

    register(req, res, next, json){
        var user = new User()
        user.email = json.email
        user.name = json.name
        user.phone = json.phone
        user.setPassword(json.password)
        user.createdAt = new Date()

        user.save().then(() => {
            resSend(res, "User successfully created!")
        }).catch(next)
    },

    login(req, res, next, json){
        User.findOne({email: json.email}).then((user) => {
            var msg = undefined
            var code = 200
    
            if(user == null || !user.isPasswordValid(json.password)){
                msg = "Email or password is not right!"
                user = undefined
                code = 400
            }else{
                user.setToken()
                user.tokenFirebase = json.firebase
                user.save()
                user = user.jsonToken()
            }
            
            resSend(res, msg, user, code)
        }).catch(next)
    },

    checkMe(req, res, next, json){
        credential(req, res).then((user) => {
            resSend(res, undefined, user.jsonCheck())
        })
        .catch(next)
    },

    logout(req, res, next, json){
        credential(req, res).then((user) => {
            user.token = undefined
            user.tokenFirebase = undefined
            user.save()
            resSend(res, "User logout")
        })
        .catch(next)
    }
}