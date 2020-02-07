var express = require('express');
var router = express.Router();
const {isAuth} = require('../helpers/autenticacao');


router.get('/', isAuth, function(req, res) {
  console.log(req.user)
      res.render('empresas', {        
        titulo:'mCloud'
      });
});

module.exports = router;
