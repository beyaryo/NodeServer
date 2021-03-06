var mongoose = require('mongoose')

var schema = new mongoose.Schema({
    type: { 
        type: String,
        enum: ['AP', 'Twitter', 'Alert', 'Aggregate', 'Gateway', 'Sensor'],
        default: 'Aggregate'
     },
     // Alert => [0 (Warning), 1 (Dangerous)]
     // Aggregate => [fuzzy value]
    desc: String,
    // AP => [Lock, Valve, Sensor Node]
    // Alert => [Sensor Node]
    // Aggregate => [Sensor Node]
    // Sensor => [Sensor Node]
    additional: String,
    ap: {type: mongoose.Schema.Types.ObjectId, ref: 'action_point'},
    gateway: {type: mongoose.Schema.Types.ObjectId, ref: 'gateway'},
    createdAt: Date
}, {
    collection: "flag",
    timestamps: false
})

schema.methods.toJSON = function(){
    return {
        type: this.type,
        desc: this.desc,
        additional: this.additional,
        gateway: this.gateway
    }
}

mongoose.model('flag', schema)

// AP => [paired, unpaired, connected or not]
// Twitter => [delay a day between actions]
// Alert => [delay 10 minutes or 3 minutes between actions]
// Aggregate => [aggregate of sensor value within 6 hours]
// Gateway => [connected, disconnected]
// Sensor => [delay a day between actions]