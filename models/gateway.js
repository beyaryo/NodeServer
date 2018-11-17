var mongoose = require('mongoose')

var schema = new mongoose.Schema({
    code: {type: String, unique: true},
    name: String,
    lat: String,
    lng: String,
    addr: String,
    ip: String,
    bssid: String,
    registered: {type: Boolean, "default": false},
    registeredBy: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    accesible: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
    createdAt: Date
}, {
    collection: "gateway",
    timestamps: false
})

schema.methods.toJSON = function(){
    return {
        code: this.code,
        name: this.name,
        lat: this.lat,
        lng: this.lng,
        addr: this.addr,
        registeredBy: this.registeredBy
    }
}

schema.methods.toJSONDetail = function(){
    return {
        code: this.code,
        name: this.name,
        lat: this.lat,
        lng: this.lng,
        addr: this.addr,
        ip: this.ip,
        bssid: this.bssid,
        registeredBy: this.registeredBy,
        accesible: this.accesible
    }
}

mongoose.model('gateway', schema)