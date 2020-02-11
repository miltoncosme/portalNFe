var express = require('express');
var router = express.Router();
var dateFormat = require('dateformat');
var fs = require('fs');
var archiver = require('archiver');
var Path = require("path");
const { Pool } = require('pg');
const { conn } = require('../db');
const {isAuth} = require('../helpers/autenticacao');
const mkdir = require('mkdirp');
const { verifyJWT } = require('../helpers/verifyJWT');

router.get('/download/nfce/cnpj/:cnpj/mesano/:mesano', isAuth, (req, res)=>{
    var st = `01.${req.params.mesano}`;
    var pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
    var date = new Date(st.replace(pattern,'$3-$2-$1'));    
    var primeiroDia = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 2, 0);  
    //     
    const pool  = new Pool(conn()) 
    const qry = `select a.caminho
    from nfce a, empresa b
    where a.data_aut between '${dateFormat(primeiroDia,'mm/dd/yyyy')}' 
    and '${dateFormat(ultimoDia,'mm/dd/yyyy')}'
    and a.empresa=b.seq
    and b.cnpj='${req.params.cnpj}'
    order by a.serie, a.numero_nf`   
    
    pool.query(qry)
        .then(con=>{
            let tmp = con.rows;            
            let rand = Math.random().toString(36).substring(7);
            let filename = `${rand}.zip`
            let output = fs.createWriteStream(`./public/download/${filename}`);
            let archive = archiver('zip', {
                gzip: true,
                zlib: { level: 9 } // Sets the compression level.
            });
            
            archive.on('error', function(err) {
              throw err;
            });            
            // pipe archive data to the output file
            archive.pipe(output);            
            // append files
            tmp.forEach(path=>{
                archive.append(fs.createReadStream(path.caminho), { name: `${Path.basename(path.caminho)}` })
            })
            //
            archive.finalize();            
            
            res.status(200).send({ result:true, dados:{uri:`/download/${filename}`,nome:`${req.params.mesano}.zip`} })
        })
        .catch(err=>{
            res.status(500).send({ result: false, dados:[], erro: err.message })
        });        
});

router.get('/download/nfe/cnpj/:cnpj/mesano/:mesano', isAuth, (req, res)=>{  
    var st = `01.${req.params.mesano}`;
    var pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
    var date = new Date(st.replace(pattern,'$3-$2-$1'));    
    var primeiroDia = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 2, 0);  
    //     
    const pool  = new Pool(conn()) 
    const qry = `select a.caminho
    from nfe a, empresa b
    where a.data_aut between '${dateFormat(primeiroDia,'mm/dd/yyyy')}' 
    and '${dateFormat(ultimoDia,'mm/dd/yyyy')}'
    and a.empresa=b.seq
    and b.cnpj='${req.params.cnpj}'
    order by a.serie, a.numero_nf`   
    
    pool.query(qry)
        .then(con=>{
            let tmp = con.rows;            
            let rand = Math.random().toString(36).substring(7);
            let filename = `${rand}.zip`
            let output = fs.createWriteStream(`./public/download/${filename}`);
            let archive = archiver('zip', {
                gzip: true,
                zlib: { level: 9 } // Sets the compression level.
            });
            
            archive.on('error', function(err) {
              throw err;
            });            
            // pipe archive data to the output file
            archive.pipe(output);            
            // append files
            tmp.forEach(path=>{
                archive.append(fs.createReadStream(path.caminho), { name: `${Path.basename(path.caminho)}` })
            })
            //
            archive.finalize();            
            
            res.status(200).send({ result:true, dados:{uri:`/download/${filename}`,nome:`${req.params.mesano}.zip`} })
        })
        .catch(err=>{
            res.status(500).send({ result: false, dados:[], erro: err.message })
        });
});

router.get('/nfce/cnpj/:cnpj/mesano/:mesano', isAuth, (req, res)=>{
    console.log('1.Data/hora: ', new Date());
    var st = `01.${req.params.mesano}`;
    var pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
    var date = new Date(st.replace(pattern,'$3-$2-$1'));
    var primeiroDia = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 2, 0);    
    const pool  = new Pool(conn());    
    const qry = `select a.chave
    , a.serie
    , a.numero_nf as numero
    , to_char(a.data_rec, 'DD/MM/YYYY') as recebido
    , to_char(a.data_aut, 'DD/MM/YYYY') as autorizado    
    , a.status
    from nfce a, empresa b
    where a.data_aut between '${dateFormat(primeiroDia,'mm/dd/yyyy')}' 
    and '${dateFormat(ultimoDia,'mm/dd/yyyy')}'
    and a.empresa=b.seq
    and b.cnpj='${req.params.cnpj}'
    order by a.serie, a.numero_nf`   
    console.log('2.Data/hora: ', new Date());
    console.log(qry);
      
    pool.query(qry)
        .then(con=>{
            console.log('3.Data/hora: ', new Date());
            var tmp = con.rows;
            const dados = tmp.map(e=>{
                switch (e.status) {
                    case 100:
                        e.status= `${e.status} - Autorizado o uso da NF-e`
                        break;
                    case 101:
                        e.status= `${e.status} - Cancelamento de NF-e homologado`
                        break;
                    case 102:
                        e.status= `${e.status} - Inutilização de número homologado`
                        break;                        
                    default:
                        break;
                }
                return Object.values(e);
            })
            console.log('4.Data/hora: ', new Date());
            res.status(200).send({ dados })
        })
        .catch(err=>{
            console.log(err.message);
            res.status(500).send({ dados:[], erro: err.message })
        })
});

router.get('/nfe/cnpj/:cnpj/mesano/:mesano', isAuth, (req, res)=>{    
    var st = `01.${req.params.mesano}`;
    var pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
    var date = new Date(st.replace(pattern,'$3-$2-$1'));    
    var primeiroDia = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 2, 0);    
    const pool  = new Pool(conn()) 
    const qry = `select a.chave
    , a.serie
    , a.numero_nf as numero
    , to_char(a.data_rec, 'DD/MM/YYYY') as recebido
    , to_char(a.data_aut, 'DD/MM/YYYY') as autorizado    
    , a.status
    from nfe a, empresa b
    where a.data_aut between '${dateFormat(primeiroDia,'mm/dd/yyyy')}' 
    and '${dateFormat(ultimoDia,'mm/dd/yyyy')}'
    and a.empresa=b.seq
    and b.cnpj='${req.params.cnpj}'
    order by a.serie, a.numero_nf`   
    
    pool.query(qry)
        .then(con=>{
            var tmp = con.rows;
            const dados = tmp.map(e=>{
                switch (e.status) {
                    case 100:
                        e.status= `${e.status} - Autorizado o uso da NF-e`
                        break;
                    case 101:
                        e.status= `${e.status} - Cancelamento de NF-e homologado`
                        break;
                    case 102:
                        e.status= `${e.status} - Inutilização de número homologado`
                        break;                        
                    default:
                        break;
                }               
                return Object.values(e);
            })
            
            res.status(200).send({ dados })
        })
        .catch(err=>{
            res.status(500).send({ dados:[], erro: err.message })
        })
});

router.get('/empresa/ativo', isAuth, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user;   
    /*
    const qry = `select a.cnpj, a.razao, (case when (b.id>=0) then true else false end) as ativo 
    from empresa a left join ativo b on a.seq=b.idempresa where seq in(
        select idempresa from grupousuario a, usuario b
        where a.idusuario=b.id
        and b.login='${usuario}'
    ) order by a.razao`;   
    */
   const qry = `select d.cnpj, d.razao, 
                case when (select true from ativo a
                where a.idusuario=f.id 
                and a.idempresa=d.seq )is null
                then false else true end as ativo
                from empresa d, grupousuario e, usuario f
                where d.seq=e.idempresa
                and f.id=e.idusuario
                and f.login='${usuario}' order by d.razao`
    pool.query(qry)
        .then(con=>{
            const tmp = con.rows
            const dados = tmp.map(e=>{
                return Object.values(e);
            })
            res.status(200).send({ dados })
        })
        .catch(err=>{
            res.status(500).send({ dados:[], erro: err.message })
        })
});

router.post('/empresa/ativo', isAuth, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user;
    const qry1 =  `insert into ativo(idusuario,idempresa)select
                   (select id from usuario where login='${usuario}'),
                   (select seq from empresa where cnpj='${req.body.cnpj}') where not exists (
                    select a.id, a.idusuario, a.idempresa from ativo a, usuario b, empresa c
                     where b.id=a.idusuario and b.login='${usuario}' and a.idempresa=c.seq
                     and c.cnpj='${req.body.cnpj}'
                   )`; 
    pool.query(qry1)
      .then(()=>{
          res.status(200).send({ result: true });
      })      
      .catch(err=>{
        console.log('erro:', err.message)
        res.status(500).send({ dados:[], erro: err.message })
      })
});

router.post('/nfce', verifyJWT, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user.nome;
    var sFilename;
    let opsys = process.platform;
    var ambient;
    if (req.body.ambiente===1){
        ambient='Producao'
    } else if (req.body.ambiente===2){
        ambient='Homologacao'
    } else {
        res.status(400).send({ result: false, dados:[], erro: 'Ambiente não informado.' })
    };
    if (typeof(req.body.serie)===Number){
        res.status(400).send({ result: false, dados:[], erro: 'Serie da NFCe inválido ou não informado.' })
    }
    if (typeof(req.body.numero)===Number){
        res.status(400).send({ result: false, dados:[], erro: 'Número da NFCe inválido ou não informado' })
    }
    if (typeof(req.body.valor)===Number){
        res.status(400).send({ result: false, dados:[], erro: 'Valor da NFCe inválido ou não informado' })
    }    
    const serie = String(req.body.serie).padStart(3, '0'); 
    if (opsys == "win32" || opsys == "win64") {
        sFilename = `C:\\SRI_SERVICES\\Recebidos\\${req.body.cnpj}\\${ambiente}\\${dateFormat(new Date(),'yyyymmdd')}\\${serie}\\`
    } else if (opsys == "linux") {
        sFilename = `/var/SRI_SERVICES/Recebidos/${req.body.cnpj}/${ambiente}/${dateFormat(new Date(),'yyyymmdd')}/${serie}`
    } else {
        res.status(400).send({ result: false, dados:[], erro: 'OPsys não definido' })  
    }
    const qryCon = `select a.login, b.cnpj from usuario a, empresa b, grupousuario c
                    where c.idempresa=b.seq and c.idusuario=a.id
                    and a.login='${usuario}'
                    and b.cnpj='${req.body.cnpj}'`
    pool.query(qryCon)
      .then(con=>{
         const dados = con.rows;
         if (dados.length > 0){
            return mkdir(sFilename)
         } else {
            throw new Error('Não autorizado. Verifique permissão.');
         }
      })
      .then(()=>{
        sFilename+=req.body.arquivo;
        fs.writeFile(sFilename, req.body.stream, 'base64', function(err) {
            if (err){
                throw new Error(err);
            }
        });
        const qryIns = `insert into nfce(
            empresa
            ,chave
            ,serie
            ,numero_nf
            ,valor
            ,data_aut
            ,hora_aut
            ,data_rec
            ,hora_rec
            ,caminho
            ,aplicativo
            ,status
            ,ambiente
            ) values (
             (select seq from empresa where cnpj='${req.body.cnpj}')
            ,'${req.body.chave}'
            ,${req.body.serie}
            ,${req.body.numero}
            ,${req.body.valor}
            ,'${req.body.dtautorizacao}'
            ,'${req.body.hrautorizacao}'
            ,'${dateFormat(new Date(),'mm/dd/yyyy')}'
            ,'${dateFormat(new Date(),'hh:mm')}'
            ,'${sFilename}'
            ,'${req.body.appname}'
            ,${req.body.status}	
            ,${req.body.ambiente}	
        )`                    
        console.log(qryIns);
        return pool.query(qryIns);
      })
      .then(()=>{
        res.status(200).send({ result: true });
      })
      .catch(err=>{
        res.status(500).send({ result: false, dados:[], erro: err.message })
      })
});

router.post('/nfe', verifyJWT, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user.nome;
    var sFilename;    
    let opsys = process.platform;
    var ambient;
    if (req.body.ambiente===1){
        ambient='Producao'
    } else if (req.body.ambiente===2){
        ambient='Homologacao'
    } else {
        res.status(400).send({ result: false, dados:[], erro: 'Ambiente não informado.' })
    };
    if (typeof(req.body.serie)===Number){
        res.status(400).send({ result: false, dados:[], erro: 'Serie da NFCe inválido ou não informado.' })
    }
    if (typeof(req.body.numero)===Number){
        res.status(400).send({ result: false, dados:[], erro: 'Número da NFCe inválido ou não informado' })
    }
    if (typeof(req.body.valor)===Number){
        res.status(400).send({ result: false, dados:[], erro: 'Valor da NFCe inválido ou não informado' })
    }    
    const serie = String(req.body.serie).padStart(3, '0'); 
    if (opsys == "win32" || opsys == "win64") {
        sFilename = `C:\\SRI_SERVICES\\Recebidos\\${req.body.cnpj}\\${ambiente}\\${dateFormat(new Date(),'yyyymmdd')}\\${serie}\\`
    } else if (opsys == "linux") {
        sFilename = `/var/SRI_SERVICES/Recebidos/${req.body.cnpj}/${ambiente}/${dateFormat(new Date(),'yyyymmdd')}/${serie}/`
    } else {
        res.status(400).send({ result: false, dados:[], erro: 'OPsys não definido' })  
    }
    const qryCon = `select a.login, b.cnpj from usuario a, empresa b, grupousuario c
                    where c.idempresa=b.seq and c.idusuario=a.id
                    and a.login='${usuario}'
                    and b.cnpj='${req.body.cnpj}'`
    pool.query(qryCon)
      .then(con=>{
         const dados = con.rows;
         if (dados.length > 0){
            return mkdir(sFilename)
         } else {
            throw new Error('Não autorizado. Verifique permissão.');
         }
      })
      .then(()=>{
        sFilename+=req.body.arquivo;
        fs.writeFile(sFilename, req.body.stream, 'base64', function(err) {
            if (err){
                throw new Error(err);
            }
        });
        const qryIns = `insert into nfe(
            empresa
            ,chave
            ,serie
            ,numero_nf
            ,valor
            ,data_aut
            ,hora_aut
            ,data_rec
            ,hora_rec
            ,caminho
            ,aplicativo
            ,status
            ,ambiente
            ) values (
             (select seq from empresa where cnpj='${req.body.cnpj}')
            ,'${req.body.chave}'
            ,${req.body.serie}
            ,${req.body.numero}
            ,${req.body.valor}
            ,'${req.body.dtautorizacao}'
            ,'${req.body.hrautorizacao}'
            ,'${dateFormat(new Date(),'mm/dd/yyyy')}'
            ,'${dateFormat(new Date(),'hh:mm')}'
            ,'${sFilename}'
            ,'${req.body.appname}'
            ,${req.body.status}	
            ,${req.body.ambiente}	
        )`                    
        console.log(qryIns);
        return pool.query(qryIns);
      })
      .then(()=>{
        res.status(200).send({ result: true });
      })
      .catch(err=>{
        res.status(500).send({ result: false, dados:[], erro: err.message })
      })
});

router.delete('/empresa/ativo', isAuth, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user;
    const qry1 = `delete from ativo where 
                  idusuario=(select id from usuario where login='${usuario}') 
                  and idempresa=(select seq from empresa where cnpj='${req.body.cnpj}')`;
    pool.query(qry1)     
      .then(con=>{        
            res.status(200).send({ result: true });        
      })
      .catch(err=>{
          res.status(500).send({ dados:[], erro: err.message })
      })

});

module.exports = router;