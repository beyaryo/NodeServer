var router = require('express').Router();

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.use('/api', require('./api'));
router.use(function(err, req, res, next){
    console.log(`Error ${err.name}`);
    console.log(`Error message ${err.message}`);
    if(err.name === 'ValidationError'){
        return res.status(422).json({
            message: Object.keys(err.errors).reduce(function(errors, key){
                return err.errors[key].message;
            }, {})
        });
    }else if(err.name === 'MongoError'){
        return res.status(422).json({
            message: err.errmsg
        });
    }else if(err.name === "TypeError"){
        return res.status(400).json({
            message: "Data not found"
        })
    }

    return next(err);
});

module.exports = router;