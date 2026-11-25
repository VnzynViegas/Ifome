//importações
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

//craduz o JSON do front-end pra objeto
app.use(express.json());

//entrega os arquivos visuais pro o navegador
app.use(express.static('public'));

//abre o .json e converte o texto pra array JS
function lerDados(nomeArquivo){
    const caminho = path.join(__dirname, 'data', nomeArquivo);
    const conteudo = fs.readFileSync(caminho, "utf-8");
    return JSON.parse(conteudo);
}

//converte o array em JSON e grava no arquivo
function salvarDados(nomeArquivo, dados){
    const caminho = path.join(__dirname, 'data', nomeArquivo);
    fs.writeFileSync(caminho, JSON.stringify(dados,null, 2), "utf-8");
}
app.listen(port, () => {
    console.log('Servidor Ifome rodando em http://Localhost:' + port);
})