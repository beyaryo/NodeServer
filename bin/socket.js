module.exports = function() {
    handleSocket = function(socket){

    }

    dummy = function(gatewayCode){
        var sensor = new Sensor()
        sensor.temp = randomInt(0, 100)
        sensor.hum = randomInt(0, 100)
        sensor.co = randomInt(0, 100)
        sensor.smoke = randomInt(0, 100)
        sensor.bat = randomInt(0, 100)
        sensor.fuzzy = randomInt(0, 100)
        sensor.gateway = gatewayCode
        this.gatewayData(sensor)
    }

    gatewayData = function(data){
        var sensor = new Sensor()
        sensor.temp = data.temp
        sensor.hum = data.hum
        sensor.co = data.co
        sensor.smoke = data.smoke
        sensor.bat = data.bat
        sensor.fuzzy = data.fuzzy
        sensor.gateway = data.gateway

        sensor.save((err) => {
            if(err) console.log(`Something went wrong ${err.message}`)
            else {
                var category = this.fuzzyCategory(sensor.fuzzy)
            }
        })
    }

    fuzzyCategory = function(value){
        if(value <= 40) return 0;
        else if(value <= 63) return 1;
        else return 2;
    }

    randomInt = function(min, max){
        return Math.floor(Math.random()*(max-min+1)+min)
    }
}