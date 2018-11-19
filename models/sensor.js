var mongoose = require('mongoose')

var schema = new mongoose.Schema({
    temp: Number,
    hum: Number,
    co: Number,
    co2: Number,
    bat: Number,
    fuzzy: Number,
    ap: {type: mongoose.Schema.Types.ObjectId, ref: 'action_point'},
    gateway: {type: mongoose.Schema.Types.ObjectId, ref: 'gateway'},
    createdAt: Date
}, {
    collection: "sensor",
    timestamps: false
})

schema.methods.toJSON = function(){
    return {
        temp: this.temp,
        hum: this.hum,
        co: this.co,
        co2: this.co2,
        bat: this.bat,
        fuzzy: this.fuzzy,
        ap: this.ap,
        gateway: this.gateway
    }
}

mongoose.model('sensor', schema)