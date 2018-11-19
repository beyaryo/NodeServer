var mongoose = require('mongoose')

var schema = new mongoose.Schema({
    code: {type: String, unique: true},
    name: String,
    registered: {type: Boolean, "default": false},
    active: {type: Boolean, "default": false},
    pairedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    gateway: {type: mongoose.Schema.Types.ObjectId, ref: 'gateway'},
    createdAt: Date
}, {
    collection: "action_point",
    timestamps: false
})

schema.methods.toJSON = function(){
    return {
        code: this.code,
        name: this.name,
        active: this.active
    }
}

schema.methods.jsonDetail = function(){
    return {
        code: this.code,
        name: this.name,
        active: this.active,
        pairedBy: this.pairedBy,
        gateway: this.gateway
    }
}

mongoose.model('action_point', schema)