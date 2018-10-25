var mongoose = require('mongoose')
    Schema = mongoose.Schema;

var schema = new mongoose.Schema({
    code: {type: String, unique: true},
    name: String,
    registered: {type: Boolean, "default": false},
    pairedBy: {type: Schema.Types.ObjectId, ref: 'user'},
    gateway: String
}, {
    collection: "action_point",
    timestamps: true
});

schema.methods.toJSON = function(){
    return {
        code: this.code,
        name: this.name
    };
};

schema.methods.jsonDetail = function(){
    return {
        code: this.code,
        name: this.name,
        pairedBy: this.pairedBy,
        gateway: this.gateway
    }
}

mongoose.model('action_point', schema);