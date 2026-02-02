var express = require('express');
var router = express.Router();

// localhost:3000/users
router.get('/', function (req, res) {
  res.send('respond with a resource');
});

// localhost:3000/users/home
router.get('/home', function (req, res) {
  res.send('respond with a resource');
});

module.exports = router;
