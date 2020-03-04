# portalNFe

Aplicativo simples para guardar e baixar copias de XMLs referente a NFe e NFCe.

## Pré-requisitos

Para o desenvolvimento, você precisará do Node.js e o banco de dados posgresSQL. Este projeto baseia-se na versão 12 do postgres.

- #### Instalação do Node no Windows

   Basta acessar o [site oficial Node.js](https://nodejs.org/) e baixar o instalador.
Além disso, certifique-se de ter o `git` disponível no seu PATH. Para mais informações acesse: ([aqui](https://git-scm.com/)).

- #### Instalação do Node no Ubuntu

  Você pode instalar o nodejs e o npm facilmente com o apt install, basta executar os seguintes comandos.

      $ sudo apt install nodejs
      $ sudo apt install npm


Se a instalação foi bem-sucedida, você poderá executar o seguinte comando.
      
      $ node --version
          v12.16.1

      $ npm --version
           6.13.4
	
## Instalando

    $ git clone https://github.com/miltoncosme/portalNFe.git portalNFe
    $ cd portalNFe
    $ npm install

## Configurando seu app

	Faça uma copia de .env.example para .env e preencha os campos solicitados

## Executando o projeto

    $ npm start	
