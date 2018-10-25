var mongoose = require('mongoose')
    Schema = mongoose.Schema;

var schema = new mongoose.Schema({
    temp: Number,
    hum: Number,
    co: Number,
    smoke: Number,
    bat: Number,
    fuzzy: Number,
    gateway: String
}, {
    collection: "sensor",
    timestamps: true
});

schema.methods.toJSON = function(){
    return {
        temp: this.temp,
        hum: this.hum,
        co: this.co,
        smoke: this.smoke,
        bat: this.bat,
        fuzzy: this.fuzzy,
        gateway: this.gateway
    };
};

mongoose.model('sensor', schema);