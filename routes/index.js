var express = require('express');
var router = express.Router();
const { Pool } = require('pg');
const { conn } = require('../db');
const {isAuth} = require('../helpers/autenticacao');


router.get('/', isAuth, (req, res)=>{
  const pool  = new Pool (conn()) 
  res.render('index', { 
      titulo: 'mCloud' 
    }
  );
});

module.exports = router;
