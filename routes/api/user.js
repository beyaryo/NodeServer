var router = require('express').Router()
    User = mongoose.model('user')

router.post('/register/check', function(req, res, next){
    var key = undefined, value = undefined
    var code = 200

    if(req.body.phone != undefined){
        key = "phone"
        value = req.body.phone
    }else if(req.body.email != undefined){
        key = "email"
        value = req.body.email
    }else{
        return returnRes(res, "Bad Request!", undefined, 400)
    }

    User.findOne({[key]: value}).then((user) => {
        key = key.charAt(0).toUpperCase() + key.slice(1)

        if(user){
            msg = `${key} available!`
        }else{
            msg = `${key} has been taken!`
            code = 400
        }
        
        returnRes(res, msg, undefined, code)
    }).catch(next)
})

router.post('/register', function(req, res, next){
    var user = new User()
    user.email = req.body.email
    user.name = req.body.name
    user.phone = req.body.phone
    user.setPassword(req.body.password)
    user.createdAt = new Date()

    user.save().then(() => {
        returnRes(res, "User successfully created!")
    }).catch(next)
});

router.post('/login', function(req, res, next){
    User.findOne({email:req.body.email}).then((user) => {
        var msg = undefined
        var code = 200

        if(user == null || !user.isPasswordValid(req.body.password)){
            msg = "Email or password is not right!"
            user = undefined
            code = 400
        }else{
            user.setToken()
            user.tokenFirebase = req.body.firebase
            user.save()
            user = user.jsonToken()
        }
        
        returnRes(res, msg, user, code)
    }).catch(next)
})

router.post('/check', function(req, res, next){
    var key = undefined, value = undefined

    if(req.body.phone != undefined){
        key = "phone"
        value = req.body.phone
    }else if(req.body.email != undefined){
        key = "email"
        value = req.body.email
    }

    var msg = undefined
    var code = 200

    credential(res, req)
    .then((result) => {
        if(key == undefined && value == undefined){
            returnRes(res, undefined, result)
        }else{
            return User.findOne({[key]: value}).exec()
        }
    })
    .then((result) => {
        if(result){
            returnRes(res, undefined, result)
        }else{
            returnRes(res, `User with ${key} ${value} not found`, undefined, 400)
        }
    })
    .catch(next)
})

router.get('/logout', function(req, res, next){
    credential(res, req)
    .then((result) => {
        user.token = undefined
        user.tokenFirebase = undefined
        user.save()
    })
})

module.exports = router