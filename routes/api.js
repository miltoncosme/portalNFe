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
            async function insertfiles() {
                await tmp.forEach(path=>{
                    archive.append(fs.createReadStream(path.caminho), { name: `${Path.basename(path.caminho)}` })
                })
                await archive.finalize();
                res.status(200).send({ result:true, dados:{uri:`/download/${filename}`,nome:`${req.params.mesano}.zip`} })    
            };
            //
            insertfiles();
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
            async function insertfiles() {
                await tmp.forEach(path=>{
                    archive.append(fs.createReadStream(path.caminho), { name: `${Path.basename(path.caminho)}` })
                });
                await archive.finalize();
                res.status(200).send({ result:true, dados:{uri:`/download/${filename}`,nome:`${req.params.mesano}.zip`} });    
            };
            insertfiles();
        })
        .catch(err=>{
            res.status(500).send({ result: false, dados:[], erro: err.message })
        });
});

router.get('/nfce/cnpj/:cnpj/mesano/:mesano', isAuth, (req, res)=>{
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
                    case 150:
                        e.status= `${e.status} - Autorizado o uso da NF-e, autorização concedida fora de prazo`
                        break;
                    case 151:
                        e.status= `${e.status} - Cancelamento de NF-e homologado fora de prazo`
                        break;    
                    case 301:
                        e.status= `${e.status} - Uso Denegado: Irregularidade fiscal do emitente`
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

router.get('/nfce/estatisticas/emitidas', isAuth, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user;
    const qry = `select 
    (select sum(aut.count) 
        from (
            (
                select count(a.*)  from nfce a
                where status in (100, 150)
                and a.data_aut >= date_trunc('month', current_date)
                and a.empresa in 
                (
                    select b.seq from empresa b, usuario c, grupousuario d 
                    where b.seq=d.idempresa and d.idusuario=c.id and c.login='${usuario}'
                )
            )		
            union all
            (
                select count(a.*) from nfe a
                where a.status in (100, 150)
                and a.data_aut >= date_trunc('month', current_date)
                and a.empresa in 
                (
                    select b.seq from empresa b, usuario c, grupousuario d 
                    where b.seq=d.idempresa and d.idusuario=c.id and c.login='${usuario}'
                )
            )
        ) aut
    ) as autorizadas ,
    (select sum(can.count)
        from (
            (
                select count(*) from nfce a
                where a.status in (101, 151)
                and a.data_aut >= date_trunc('month', current_date)
                and a.empresa in 
                (
                    select b.seq from empresa b, usuario c, grupousuario d 
                    where b.seq=d.idempresa and d.idusuario=c.id and c.login='${usuario}'
                )
            )
            union all
            (
                select count(*) from nfe a
                where a.status in (101, 151)
                and a.data_aut >= date_trunc('month', current_date)
                and a.empresa in 
                (
                    select b.seq from empresa b, usuario c, grupousuario d 
                    where b.seq=d.idempresa and d.idusuario=c.id and c.login='${usuario}'
                )		
            )
         ) can
    ) as canceladas,
    (select sum(inu.count)
        from (
            (
                select count(*) from nfce a
                where a.status=102
                and a.data_aut >= date_trunc('month', current_date)
                and a.empresa in 
                (
                    select b.seq from empresa b, usuario c, grupousuario d 
                    where b.seq=d.idempresa and d.idusuario=c.id and c.login='${usuario}'
                )
            )
            union all
            (
                select count(*) from nfe a
                where a.status=102
                and a.data_aut >= date_trunc('month', current_date)
                and a.empresa in 
                (
                    select b.seq from empresa b, usuario c, grupousuario d 
                    where b.seq=d.idempresa and d.idusuario=c.id and c.login='${usuario}'
                )
            )
        ) inu
    ) as inutilizadas
    from empresa limit 1`;
    pool.query(qry)
        .then(con=>{
            //const dados = con.rows
            const tmp = con.rows
            const dados = tmp.map(e=>{
                return Object.assign(e,{total:(Number(e.autorizadas)+Number(e.canceladas)+Number(e.inutilizadas))});
            })
            res.status(200).send({ dados })
        })
        .catch(err=>{
            res.status(500).send({ dados:[], erro: err.message })
        })            
});

router.get('/nfce/estatisticas/uso', isAuth, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user;
    const qry = `select p.razao, p.qtd from ((select res.razao, sum(res.count) as qtd
                    from (
                        (select  b.razao, count(a.*)  from nfce a, empresa b, usuario c, grupousuario d
                        where a.empresa=b.seq
                        and a.empresa=d.idempresa
                        and d.idusuario=c.id
                        and c.login='${usuario}' group by b.razao)	
                        union all
                        (select  f.razao, count(e.*) from nfe e, empresa f, usuario g, grupousuario h
                        where e.empresa=f.seq
                        and e.empresa=h.idempresa
                        and h.idusuario=g.id
                        and g.login='${usuario}' group by f.razao)		
                    ) res  group by res.razao order by qtd desc limit 3) union all
                (select 'OUTROS' as razao, sum(out.qtd) from (select res.razao, sum(res.count) as qtd
                    FROM (
                        (select  b.razao, count(a.*)  from nfce a, empresa b, usuario c, grupousuario d
                        where a.empresa=b.seq
                        and a.empresa=d.idempresa
                        and d.idusuario=c.id
                        and c.login='${usuario}' group by b.razao)	
                        union all
                        (select  f.razao, count(e.*) from nfe e, empresa f, usuario g, grupousuario h
                        where e.empresa=f.seq
                        and e.empresa=h.idempresa
                        and h.idusuario=g.id
                        and g.login='${usuario}' group by f.razao)		
                    ) res  group by res.razao order by qtd desc offset 3) out)) p order by p.qtd desc`;
    pool.query(qry)
        .then(con=>{
            const tmp = con.rows
            const dados = [];
            function cor(i){
                switch(i){
                    case 0:
                        return '#DA5430';
                        break;
                    case 1:
                        return '#2091CF';
                        break;
                    case 2:
                        return '#AF4E96';
                        break;
                    case 3:
                        return '#68BC31';
                        break;
                    default:
                        return getRandomColor();
                }
            }
            async function monta(){
                await tmp.map((e,i)=>{
                    dados.push(
                        {
                            label:e.razao,
                            data:Number(e.qtd), 
                            color: cor(i)  
                        });
                });    
            }
            monta();
            res.status(200).send({ dados })
        })
        .catch(err=>{
            res.status(500).send({ dados:[], erro: err.message })
        })                    
});

router.get('/nfce/estatisticas/ultimas', isAuth, (req,res)=>{
  const pool  = new Pool (conn());
  const usuario = req.user;   
   
  const qry = `SELECT *
                FROM (
                        (select 'NFCe' as tipo, b.razao, a.caminho, a.data_rec, a.hora_rec from nfce a, empresa b, usuario c, grupousuario d
                        where a.empresa=b.seq
                        and a.empresa=d.idempresa
                        and d.idusuario=c.id
                        and c.login='${usuario}' order by a.data_rec desc, a.hora_rec desc limit 10)	
                        union all
                        (select 'NFe' as tipo, f.razao, e.caminho, e.data_rec, e.hora_rec from nfe e, empresa f, usuario g, grupousuario h
                        where e.empresa=f.seq
                        and e.empresa=h.idempresa
                        and h.idusuario=g.id
                        and g.login='${usuario}' order by e.data_rec desc, e.hora_rec desc limit 10)		
                    ) res order by res.data_rec desc, res.hora_rec desc limit 10`
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
        res.status(500).send({ dados:[], erro: err.message })
      })
});

router.post('/nfce', verifyJWT, (req,res)=>{
    const pool  = new Pool (conn());
    const usuario = req.user.nome;
    var sFilename;
    let opsys = process.platform;
    var ambiente;
    if (req.body.ambiente===1){
        ambiente='Producao'
    } else if (req.body.ambiente===2){
        ambiente='Homologacao'
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
        const qryIns = `INSERT INTO nfce (empresa,
            chave,
            serie,
            numero_nf,
            valor,
            data_aut,
            hora_aut,
            data_rec,
            hora_rec,
            caminho,
            aplicativo,
            status,
            ambiente)
            VALUES
            (   (select seq from empresa where cnpj='${req.body.cnpj}')
            ,'${req.body.chave}'
            ,${req.body.serie}
            ,${req.body.numero}
            ,${req.body.valor}
            ,'${req.body.dtautorizacao}'
            ,'${req.body.hrautorizacao}'
            ,'${dateFormat(new Date(),'mm/dd/yyyy')}'
            ,'${dateFormat(new Date(),'HH:MM:ss')}'
            ,'${sFilename}'
            ,'${req.body.appname}'
            ,${req.body.status}	
            ,${req.body.ambiente}	) 
            ON CONFLICT (empresa,serie,numero_nf,ambiente) DO
            UPDATE SET 
                status = ${req.body.status},
                caminho = '${sFilename}',
                aplicativo = '${req.body.appname}',
                valor = ${req.body.valor},
                data_aut = '${req.body.dtautorizacao}',
                hora_aut = '${req.body.hrautorizacao}',
                data_rec = '${dateFormat(new Date(),'mm/dd/yyyy')}',
                hora_rec = '${dateFormat(new Date(),'HH:MM:ss')}'
            where 
                nfce.status not in(101,151)`;
        /*
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
            ,'${dateFormat(new Date(),'HH:MM:ss')}'
            ,'${sFilename}'
            ,'${req.body.appname}'
            ,${req.body.status}	
            ,${req.body.ambiente}	
        )`    */                
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
    var ambiente;
    if (req.body.ambiente===1){
        ambiente='Producao'
    } else if (req.body.ambiente===2){
        ambiente='Homologacao'
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
        const qryIns = `INSERT INTO nfe (empresa,
            chave,
            serie,
            numero_nf,
            valor,
            data_aut,
            hora_aut,
            data_rec,
            hora_rec,
            caminho,
            aplicativo,
            status,
            ambiente)
            VALUES
            (   (select seq from empresa where cnpj='${req.body.cnpj}')
            ,'${req.body.chave}'
            ,${req.body.serie}
            ,${req.body.numero}
            ,${req.body.valor}
            ,'${req.body.dtautorizacao}'
            ,'${req.body.hrautorizacao}'
            ,'${dateFormat(new Date(),'mm/dd/yyyy')}'
            ,'${dateFormat(new Date(),'HH:MM:ss')}'
            ,'${sFilename}'
            ,'${req.body.appname}'
            ,${req.body.status}	
            ,${req.body.ambiente}	) 
            ON CONFLICT (empresa,serie,numero_nf,ambiente) DO
            UPDATE SET 
                status = ${req.body.status},
                caminho = '${sFilename}',
                aplicativo = '${req.body.appname}',
                valor = ${req.body.valor},
                data_aut = '${req.body.dtautorizacao}',
                hora_aut = '${req.body.hrautorizacao}',
                data_rec = '${dateFormat(new Date(),'mm/dd/yyyy')}',
                hora_rec = '${dateFormat(new Date(),'HH:MM:ss')}'
            where 
                nfe.status not in(101,151)`;

        /*
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
            ,'${dateFormat(new Date(),'HH:MM:ss')}'
            ,'${sFilename}'
            ,'${req.body.appname}'
            ,${req.body.status}	
            ,${req.body.ambiente}	
        )` 
        */                   
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

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

module.exports = router;