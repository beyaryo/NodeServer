var mongoose = require('mongoose')
    Schema = mongoose.Schema;

var schema = new mongoose.Schema({
    type: { 
        type: String,
        enum: ['Lock', 'Twitter', 'Alert', 'Aggregate', 'Gateway'],
        default: 'Aggregate'
     },
    desc: String,
    additional: String,
    gateway: String
}, {
    collection: "flag",
    timestamps: true
});

schema.methods.toJSON = function(){
    return {
        type: this.type,
        desc: this.desc,
        additional: this.additional,
        gateway: this.gateway
    };
};

mongoose.model('flag', schema);