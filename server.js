const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

function lerDados(nomeArquivo) {
    const caminho = path.join(__dirname, "data", nomeArquivo);
    if (!fs.existsSync(caminho)) {
        fs.writeFileSync(caminho, "[]", "utf-8");
    }
    const conteudo = fs.readFileSync(caminho, "utf-8");
    return JSON.parse(conteudo || "[]");
}

function salvarDados(nomeArquivo, dados) {
    const caminho = path.join(__dirname, "data", nomeArquivo);
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf-8");
}

app.post("/usuarios", (req, res) => {
    const { nome, email, senha, endereco } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Preencha nome, e-mail e senha." });
    }

    const usuarios = lerDados("usuarios.json");
    const jaExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (jaExiste) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
    }

    const novoUsuario = {
        id: Date.now(),
        nome,
        email,
        senha,
        endereco: endereco || "",
        favoritos: []
    };

    usuarios.push(novoUsuario);
    salvarDados("usuarios.json", usuarios);

    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    res.status(201).json(usuarioSemSenha);
});

app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    const usuarios = lerDados("usuarios.json");
    const usuario = usuarios.find(
        u => u.email.toLowerCase() === (email || "").toLowerCase() && u.senha === senha
    );

    if (!usuario) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    if (!usuario.favoritos) {
        usuario.favoritos = [];
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
});

app.post("/usuarios/:id/favoritos", (req, res) => {
    const { restauranteId } = req.body;
    const usuarios = lerDados("usuarios.json");
    const index = usuarios.findIndex(u => u.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    if (!Array.isArray(usuarios[index].favoritos)) {
        usuarios[index].favoritos = [];
    }

    const restIdNum = Number(restauranteId);
    const jaFavorito = usuarios[index].favoritos.includes(restIdNum);

    if (jaFavorito) {
        usuarios[index].favoritos = usuarios[index].favoritos.filter(id => id !== restIdNum);
    } else {
        usuarios[index].favoritos.push(restIdNum);
    }

    salvarDados("usuarios.json", usuarios);
    res.json({ favoritos: usuarios[index].favoritos });
});

app.get("/restaurantes", (req, res) => {
    const restaurantes = lerDados("restaurantes.json");
    res.json(restaurantes);
});

app.get("/restaurantes/:id", (req, res) => {
    const restaurantes = lerDados("restaurantes.json");
    const restaurante = restaurantes.find(r => r.id == req.params.id);
    if (!restaurante) {
        return res.status(404).json({ erro: "Restaurante não encontrado." });
    }
    res.json(restaurante);
});

app.post("/restaurantes", (req, res) => {
    const { nome, categoria, tempoEntrega, taxaEntrega, imagem, descricao } = req.body;
    if (!nome || !categoria) {
        return res.status(400).json({ erro: "Nome e categoria são obrigatórios." });
    }

    const restaurantes = lerDados("restaurantes.json");
    const novoRestaurante = {
        id: Date.now(),
        nome,
        categoria,
        tempoEntrega: tempoEntrega || "30-45 min",
        taxaEntrega: Number(taxaEntrega) || 0,
        avaliacao: 5.0,
        imagem: imagem || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
        descricao: descricao || ""
    };

    restaurantes.push(novoRestaurante);
    salvarDados("restaurantes.json", restaurantes);
    res.status(201).json(novoRestaurante);
});

app.put("/restaurantes/:id", (req, res) => {
    const restaurantes = lerDados("restaurantes.json");
    const index = restaurantes.findIndex(r => r.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ erro: "Restaurante não encontrado." });
    }

    restaurantes[index] = {
        ...restaurantes[index],
        ...req.body,
        id: restaurantes[index].id
    };

    salvarDados("restaurantes.json", restaurantes);
    res.json(restaurantes[index]);
});

app.delete("/restaurantes/:id", (req, res) => {
    let restaurantes = lerDados("restaurantes.json");
    const existe = restaurantes.some(r => r.id == req.params.id);
    if (!existe) {
        return res.status(404).json({ erro: "Restaurante não encontrado." });
    }

    restaurantes = restaurantes.filter(r => r.id != req.params.id);
    salvarDados("restaurantes.json", restaurantes);

    let pratos = lerDados("pratos.json");
    pratos = pratos.filter(p => p.restauranteId != req.params.id);
    salvarDados("pratos.json", pratos);

    res.json({ mensagem: "Restaurante removido com sucesso." });
});

app.get("/pratos", (req, res) => {
    let pratos = lerDados("pratos.json");
    if (req.query.restauranteId) {
        pratos = pratos.filter(p => p.restauranteId == req.query.restauranteId);
    }
    res.json(pratos);
});

app.post("/pratos", (req, res) => {
    const { restauranteId, nome, descricao, preco, imagem } = req.body;
    if (!restauranteId || !nome || preco === undefined) {
        return res.status(400).json({ erro: "Restaurante, nome e preço são obrigatórios." });
    }

    const pratos = lerDados("pratos.json");
    const novoPrato = {
        id: Date.now(),
        restauranteId: Number(restauranteId),
        nome,
        descricao: descricao || "",
        preco: Number(preco),
        imagem: imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
    };

    pratos.push(novoPrato);
    salvarDados("pratos.json", pratos);
    res.status(201).json(novoPrato);
});

app.put("/pratos/:id", (req, res) => {
    const pratos = lerDados("pratos.json");
    const index = pratos.findIndex(p => p.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ erro: "Prato não encontrado." });
    }

    pratos[index] = {
        ...pratos[index],
        ...req.body,
        id: pratos[index].id,
        restauranteId: req.body.restauranteId ? Number(req.body.restauranteId) : pratos[index].restauranteId,
        preco: req.body.preco !== undefined ? Number(req.body.preco) : pratos[index].preco
    };

    salvarDados("pratos.json", pratos);
    res.json(pratos[index]);
});

app.delete("/pratos/:id", (req, res) => {
    let pratos = lerDados("pratos.json");
    const existe = pratos.some(p => p.id == req.params.id);
    if (!existe) {
        return res.status(404).json({ erro: "Prato não encontrado." });
    }

    pratos = pratos.filter(p => p.id != req.params.id);
    salvarDados("pratos.json", pratos);
    res.json({ mensagem: "Prato removido com sucesso." });
});

app.post("/pedidos", (req, res) => {
    const { usuarioId, itens, total } = req.body;
    if (!usuarioId || !itens || itens.length === 0) {
        return res.status(400).json({ erro: "Usuário ou itens do carrinho inválidos." });
    }

    const pedidos = lerDados("pedidos.json");
    const novoPedido = {
        id: Date.now(),
        usuarioId: Number(usuarioId),
        itens,
        total: Number(total),
        status: "Entregue",
        data: new Date().toLocaleString("pt-BR")
    };

    pedidos.push(novoPedido);
    salvarDados("pedidos.json", pedidos);
    res.status(201).json(novoPedido);
});

app.get("/pedidos", (req, res) => {
    let pedidos = lerDados("pedidos.json");
    if (req.query.usuarioId) {
        pedidos = pedidos.filter(p => p.usuarioId == req.query.usuarioId);
    }
    res.json(pedidos);
});

app.get("/avaliacoes", (req, res) => {
    let avaliacoes = lerDados("avaliacoes.json");
    if (req.query.restauranteId) {
        avaliacoes = avaliacoes.filter(a => a.restauranteId == req.query.restauranteId);
    }
    res.json(avaliacoes);
});

app.post("/avaliacoes", (req, res) => {
    const { restauranteId, usuarioId, usuarioNome, nota, comentario } = req.body;
    if (!restauranteId || !usuarioId || !nota) {
        return res.status(400).json({ erro: "Dados da avaliação incompletos." });
    }

    const avaliacoes = lerDados("avaliacoes.json");
    const novaAvaliacao = {
        id: Date.now(),
        restauranteId: Number(restauranteId),
        usuarioId: Number(usuarioId),
        usuarioNome: usuarioNome || "Cliente",
        nota: Number(nota),
        comentario: comentario || "",
        data: new Date().toLocaleDateString("pt-BR")
    };

    avaliacoes.push(novaAvaliacao);
    salvarDados("avaliacoes.json", avaliacoes);

    const avaliacoesRest = avaliacoes.filter(a => a.restauranteId == restauranteId);
    const media = avaliacoesRest.reduce((acc, a) => acc + a.nota, 0) / avaliacoesRest.length;

    const restaurantes = lerDados("restaurantes.json");
    const idxRest = restaurantes.findIndex(r => r.id == restauranteId);
    if (idxRest !== -1) {
        restaurantes[idxRest].avaliacao = Number(media.toFixed(1));
        salvarDados("restaurantes.json", restaurantes);
    }

    res.status(201).json(novaAvaliacao);
});

app.listen(port, () => {
    console.log("Servidor Ifome rodando em http://localhost:" + port);
});