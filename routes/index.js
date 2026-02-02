var express = require('express');
var router = express.Router();

// localhost:3000
router.get('/', function (req, res) {
  res.render('index', { title: 'Express' });
});

// localhost:3000/home
router.get('/home', function (req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
