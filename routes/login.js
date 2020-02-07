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

module.exports = router;
