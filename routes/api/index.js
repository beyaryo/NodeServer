var router = require('express').Router()
require('../../bin/tools.js')()

router.use('/user', require('./user'))
router.use('/gw', require('./gateway'))
router.use('/ap', require('./ap'))

module.exports = router;