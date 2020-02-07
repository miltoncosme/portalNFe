var express = require('express');
var router = express.Router();
const {isAuth} = require('../helpers/autenticacao');


router.get('/', isAuth, (req, res)=>{
  res.render('usuarios',{
      titulo:'mCloud'
    }
  );
});

module.exports = router;
