require('dotenv/config');

var recursiva = function () {
    console.log(new Date(), ' - Limpando temporarios...');
    function filtrarPorExtensao(fileName) {
        return fileName.endsWith('.zip');
      };
    let fsReadDirRecGen = require('fs-readdir-rec-gen');    
    for (let file of fsReadDirRecGen('./public/download', filtrarPorExtensao)) {
        console.log('Apagando ', file);
        let fs = require('fs');
        fs.unlinkSync(file);
    }
    setTimeout(recursiva, 21600000);
}
recursiva();