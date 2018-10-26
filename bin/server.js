var app = require('../app')
    mongoose = require('mongoose')
    config = require('./config')
    http = require('http')
    socketIO = require('socket.io')
    Sensor = mongoose.model('sensor')
    require('./socket.js')()
    require('./tools.js')()

// connect to db server
mongoose.connect(config.database, {useNewUrlParser: true}, 
    function (error) {
        if (error) print(`DB error => ${error}`);
        else print(`Db url ${config.database.split("@")[1]}`); 
    }
);
    
// start server...
var server = app.listen( process.env.PORT || 3000, () => {
    print(`Listening on port ${server.address().port}`);
});

// listening socket
var io = socketIO.listen(server);

io.on('connection', function (socket) {
    handleSocket(socket);
});

// setInterval(() => {
    // request(url);
    // console.log("Requesting self again in 25 minutes");
// }, (1000 * 60 * 25 * 1));

// setInterval(() => {
//     dummy("usa87")
// }, (1000 * 13 * 1 * 1)); // mili * second * minute * hour

// setInterval(() => {
//     aggregating()
// }, (1000 * 60 * 1 * 1)); // mili * second * minute * hour