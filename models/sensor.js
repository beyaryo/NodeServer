var mongoose = require('mongoose')
    Schema = mongoose.Schema;

var schema = new mongoose.Schema({
    temp: Number,
    hum: Number,
    co: Number,
    co2: Number,
    bat: Number,
    fuzzy: Number,
    gateway: String,
    ap: String,
    createdAt: Date
}, {
    collection: "sensor",
    timestamps: false
});

schema.methods.toJSON = function(){
    return {
        temp: this.temp,
        hum: this.hum,
        co: this.co,
        co2: this.co2,
        bat: this.bat,
        fuzzy: this.fuzzy,
        gateway: this.gateway,
        ap: this.ap
    };
};

mongoose.model('sensor', schema);