var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { conn } = require('../db');



router.post('/', (req, res) => {   
    const pool = new Pool(conn())
    const usuario = req.body.user
    const senha = req.body.pwd
    var qry = `select id, login from usuario where login='${usuario}' and senha='${senha}'`   
    pool
      .query(qry)
      .then(con => {      
        const dados = con.rows[0]
        if (dados.id) {
          const nome = dados.login
          var token = jwt.sign({nome}, process.env.SECRET_API, {
            expiresIn: 3200
          });
          res.status(200).send({ auth: true, token: token})
        }
        else {
          res.status(401).send({ auth: false, erro: 'Login inválido!' })
        }
      })
      .catch(err => {
        res.status(500).send({ auth: false, erro: err.message})
      })
  })

  module.exports = router;
  