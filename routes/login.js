var express = require('express');
var router = express.Router();
const { Pool } = require('pg');
const { conn } = require('../db');
const passport = require('passport')

/* GET users listing. */
router.get('/', (req, res)=>{
  res.render('login');
});

router.post('/', (req, res, next) => {
  console.log('post: ')
  passport.authenticate("local",{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
  })(req,res,next)
})

router.post('/mudarsenha', (req, res, next) => {
  const pool  = new Pool (conn());
  const usuario = req.user;
  const {senhaatual} = req.body;
  const {senhanova} = req.body;
  const {repetirsenhanova} = req.body;
  if (senhanova!==repetirsenhanova){
    res.status(500).send({ result: false, erro: 'A senha que você repetiu não coincide.' });
    return;
  } else if(senhanova===senhaatual){ 
    res.status(500).send({ result: false, erro: 'Senha nova não pode ser a mesma da antiga.'});
    return;
  }  
  const qry = `select id from usuario where login='${usuario}' and senha='${senhaatual}'`;
  const qryUpdate = `update usuario set
                     senha='${senhanova}' where login='${usuario}' and senha='${senhaatual}'`;
  pool.query(qry)
    .then(con=>{
      if (con.rows.length > 0){
        return pool.query(qryUpdate);
      } else {
        throw new Error('Senha atual incorreta!');
      }
    })
    .then(con=>{
      req.logout();
      res.status(200).send({ result: true })
    })
    .catch(err=>{
       res.status(500).send({ result: false, erro: err.message })
    })
})

module.exports = router;
