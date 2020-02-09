var express = require('express');
var router = express.Router();
var dateFormat = require('dateformat');
const { Pool } = require('pg');
const { conn } = require('../db');
const { mes } = require('../mes');
const {isAuth} = require('../helpers/autenticacao');

/* GET users listing. */


router.get('/', isAuth, (req, res)=>{
  const pool  = new Pool (conn());  
  const usuario = req.user;
  consultEmp(usuario);
  async function consultEmp(user){
    /*
    let qry = `select a.cnpj, a.razao, (case when (b.id>=0) then true else false end) as ativo 
    from empresa a left join ativo b on a.seq=b.idempresa where a.seq in(
    select idempresa from grupousuario a, usuario b
    where a.idusuario=b.id
    and b.login='${user}') order by a.razao`
    */
   let qry = `select d.cnpj, d.razao, 
              case when (select true from ativo a
              where a.idusuario=f.id 
              and a.idempresa=d.seq )is null
              then false else true end as ativo
              from empresa d, grupousuario e, usuario f
              where d.seq=e.idempresa
              and f.id=e.idusuario
              and f.login='${user}' order by d.razao`
    const periodo = [];  
      
    const d1 = new Date()
    const d2 = new Date()
    const d3 = new Date()
    d1.setMonth(d1.getMonth() - 1);
    d2.setMonth(d2.getMonth() - 2);
    d3.setMonth(d3.getMonth() - 3);

    mes.map(s=>{
      if(s.key===dateFormat(d1, "mm")){
        periodo.push({key:s.key,value:`${s.value}/${dateFormat(d1, "yyyy")}`})
      } else  if(s.key===dateFormat(d2, "mm")){
        periodo.push({key:s.key,value:`${s.value}/${dateFormat(d2, "yyyy")}`})
      } else  if(s.key===dateFormat(d3, "mm")){
        periodo.push({key:s.key,value:`${s.value}/${dateFormat(d3, "yyyy")}`})
      }
    })
   

    try {
      const con = await pool.query(qry);
      const empresas = con.rows
      res.render('nfce', {        
        titulo:'mCloud',
        empresas:empresas,
        periodo:periodo
      })    
    } catch { 
       res.render('nfce', {       
        titulo:'mCloud',
        empresas:[],
        periodo:periodo
      })     
    }
  }
  
 
 
});

module.exports = router;
