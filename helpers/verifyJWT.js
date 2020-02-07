var jwt = require('jsonwebtoken')

function verifyJWT(req, res, next) {
  var token = req.headers['x-access-token'];  
  if (!token)
    return res.status(401).send({ result: false, erro: 'Nenhum token fornecido.' })
  jwt.verify(token, process.env.SECRET_API, function (err, decoded) {

    if (err)
      return res.status(500).send({ result: false, erro: 'Falha ao autenticar o token.' })
    const {nome} = decoded;
    req.user = {nome};
    next();
  });
}

exports.verifyJWT = verifyJWT
