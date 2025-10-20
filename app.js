//importar modulo express dentro do nosso programa
const express = require('express');

//vamos importar o fileupload para manipular arquivos

const fileUpload = require('express-fileupload')

// vamos importar o modulo express-handlebar
const {engine} = require('express-handlebars');

//importar o modulo mysdl2
const mysql = require('mysql2');

//importanto biblioteca para manipulação de arquivos
const fs = require('fs');

//vamos criar uma constante para ceber o objeto da funcao express()
const app = express();

//precisamos habilitar o uso da biblioteca fileupload

app.use(fileUpload());

// adicioar bootstrap no codigo

app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));    

// adicionar o arquivo de css dentro do app

app.use ('/css', express.static('./css'));

//referenciar a pasta imagens no app

app.use('/imagens', express.static('./imagens'));

// vamos agora indicar para o app que tipo de dados a rota irá manipular
app.use(express.json());
app.use(express.urlencoded({extended:false}))

//configuracao de conexao do banco de dados
const conexao = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'sercundo290411',
    database:'projeto'
});

//vamos configurar o handlebars

app.engine('handlebars', engine({
    helpers: {
        //funcao auxiliar para verificar igualdade
        condicionalIgualdade : function (parametro1, parametro2, options) {
            return parametro1 === parametro2 ? options.fn(this) : options.inverse(this)
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');


//vamos criar um teste de conexao para verificar o banco de dados
conexao.connect(function(erro){
    if (erro) throw erro;
    console.log('conexao efetuada com sucesso')
});


// nossa rota principal

app.get('/', function(req, res) {
    let sql = 'SELECT * FROM produtos';
    conexao.query(sql, function(erro, retorno) {
        if (erro) throw erro;
        res.render('formulario', {produtos:retorno});
    })
});

// nossa rota principal contendo a informação da situação atual do programa (mensagem de acerto ou erro)

app.get('/:situacao', function(req, res) {
    let sql = 'SELECT * FROM produtos';
    conexao.query(sql, function(erro, retorno) {
        if (erro) throw erro;
        res.render('formulario', {produtos:retorno, situacao:req.params.situacao});
    })
});


// rota para cadastrp

app.post('/cadastrar', function(req, res) {
    try {
        //obter os dados que sera utilizados para o cadastro
    let nome = req.body.nome;
    let valor = req.body.valor;
    let imagem = req.files.imagem.name;

    // validar o nome do produto e o valor

    if (nome == '' || valor == '' || isNaN(valor)) {
        res.redirect('/falhaCadastro');
    }else{
        let sql = `INSERT INTO produtos (nome, valor, imagem) VALUES ('${nome}', ${valor}, '${imagem}')`;

        //ultima etapa é executar o comando SQL - 

        conexao.query(sql, function(erro, retorno) {
            //caso ocorra algum erro
            if (erro) throw erro;
            //caso seja sucesso, ai sim vamos armazenar a imagem
            req.files.imagem.mv(__dirname+"/imagens/"+req.files.imagem.name);
            console.log(retorno);
            //retornar agora para a rota principa
            res.redirect('/okCadastro');
        })
    };
    // agora vamos criar a estrutura do mysql
    
    }catch(erro){
        res.redirect('/falhaCadastro');
    }
})

//rota para remover produtos

app.get('/remover/:codigo&:imagem', function (req, res) {
    //tratamento de excessao
    try {
        let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;
        conexao.query(sql, function(erro, retorno) {
            if (erro) throw erro;
                fs.unlink(__dirname+'/imagens/'+req.params.imagem, (erro_imagem) => {
                console.log("erro ao remover o item");
            });
    });
    res.redirect('/okRemover');
    }catch(erro){
        res.redirect('/falhaRemover')
    }
});

//rota para redirecinar para o formulario de alteração

app.get('/formularioEditar/:codigo', function(req, res) {
    let sql = `SELECT * FROM produtos WHERE codigo= ${req.params.codigo}`
    conexao.query(sql, function(erro, retorno) {
        if (erro) throw erro;
         res.render('formularioEditar', {produto:retorno[0]});
    })
});

//rota para editar produtor

app.post('/editar', function(req, res) {
    //pegar as informacoes doformulario
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;
        
    if (nome == '' || valor == ''  || isNaN(valor)){
        res.redirect('/falhaEdicao');
    }else{
        try {
        let imagem = req.files.imagem;
        let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${imagem.name}' WHERE codigo=${codigo}`;
        conexao.query(sql, function(erro, retorno){
            if (erro) throw erro;
            fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem) => {
                console.log('erro ao remover a imagem');
            });
            imagem.mv(__dirname+'/imagens/'+imagem.name);
        })
        } catch (erro){
            let sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;
            conexao.query(sql, function(erro, retorno){
            if (erro) throw (erro);
            })
        }

    //definir o tipo de edição
        try {
            let imagem = req.files.imagem;
            let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${imagem.name}' WHERE codigo=${codigo}`;
            conexao.query(sql, function(erro, retorno){
                if (erro) throw erro;
                fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem) => {
                    console.log('erro ao remover a imagem');
                });
                imagem.mv(__dirname+'/imagens/'+imagem.name);
            })
        } catch (erro){
            let sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;
            conexao.query(sql, function(erro, retorno){
                if (erro) throw (erro);
            })
        }
        //finaliar a rota
        res.redirect('/okEdicao');
        }
    
});

// a ultima parte agora sera criar um servidor

app.listen(8080);