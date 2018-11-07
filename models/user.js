var mongoose = require('mongoose')
    crypto = require('crypto');

var schema = new mongoose.Schema({
    email: {
        type: String,
        unique: true, 
        required: [true, "Email can't be blank"], 
        match: [/\S+@\S+\.\S+/, 'Email is invalid'], index: true
    },
    name: String,
    phone: { 
        type: String, 
        unique: true,
        required: [true, "Phone can't be blank"]
    },
    token: String,
    tokenFirebase: String,
    hash: String,                   // encrypted password
    salt: String,                   // key to decrypt hash to password
    createdAt: Date
}, {
    collection: "user",
    timestamps: false
});

schema.methods.isPasswordValid = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

schema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

schema.methods.setToken = function(){
    this.token = crypto.randomBytes(16).toString('hex');
};

schema.methods.toJSON = function(){
    return {
        email: this.email,
        name: this.name,
        phone: this.phone
    };
};

schema.methods.jsonToken = function(){
    return {
        email: this.email,
        name: this.name,
        phone: this.phone,
        token: this.token
    };
};

schema.methods.jsonCheck = function(){
    return {
        id: this._id,
        email: this.email,
        name: this.name,
        phone: this.phone
    };
};

mongoose.model('user', schema);