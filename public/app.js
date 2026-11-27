function obterUsuarioLogado() {
    const dados = localStorage.getItem("ifome_usuario");
    return dados ? JSON.parse(dados) : null;
}

function salvarUsuarioLogado(usuario) {
    localStorage.setItem("ifome_usuario", JSON.stringify(usuario));
}

function atualizarCabecalhoUsuario() {
    const linkUsuario = document.getElementById("link-usuario");
    if (!linkUsuario) return;

    const usuario = obterUsuarioLogado();
    if (usuario) {
        linkUsuario.textContent = `Olá, ${usuario.nome.split(" ")[0]} (Sair)`;
        linkUsuario.href = "#";
        linkUsuario.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem("ifome_usuario");
            window.location.href = "login.html";
        };
    }
}

function exibirAlerta(elementoId, mensagem, tipo = "sucesso") {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.textContent = mensagem;
    el.className = `alerta alerta-${tipo}`;
    el.classList.remove("oculto");
    setTimeout(() => el.classList.add("oculto"), 4000);
}

function iniciarLoginCadastro() {
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");
    if (!formLogin || !formCadastro) return;

    document.getElementById("btn-mostrar-cadastro").onclick = (e) => {
        e.preventDefault();
        formLogin.classList.add("oculto");
        formCadastro.classList.remove("oculto");
    };

    document.getElementById("btn-mostrar-login").onclick = (e) => {
        e.preventDefault();
        formCadastro.classList.add("oculto");
        formLogin.classList.remove("oculto");
    };

    formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const senha = document.getElementById("login-senha").value;

        const resp = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        const dados = await resp.json();

        if (!resp.ok) {
            return exibirAlerta("mensagem-auth", dados.erro || "Erro ao entrar.", "erro");
        }

        salvarUsuarioLogado(dados);
        exibirAlerta("mensagem-auth", "Login realizado! Redirecionando...", "sucesso");
        setTimeout(() => (window.location.href = "index.html"), 800);
    };

    formCadastro.onsubmit = async (e) => {
        e.preventDefault();
        const nome = document.getElementById("cad-nome").value;
        const email = document.getElementById("cad-email").value;
        const endereco = document.getElementById("cad-endereco").value;
        const senha = document.getElementById("cad-senha").value;

        const resp = await fetch("/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, endereco, senha })
        });
        const dados = await resp.json();

        if (!resp.ok) {
            return exibirAlerta("mensagem-auth", dados.erro || "Erro ao cadastrar.", "erro");
        }

        salvarUsuarioLogado(dados);
        exibirAlerta("mensagem-auth", "Conta criada com sucesso! Redirecionando...", "sucesso");
        setTimeout(() => (window.location.href = "index.html"), 800);
    };
}

let todosRestaurantes = [];
let categoriaSelecionada = "";

async function iniciarHome() {
    const container = document.getElementById("lista-restaurantes");
    if (!container) return;

    const resp = await fetch("/restaurantes");
    todosRestaurantes = await resp.json();
    renderizarRestaurantesHome();

    const inputBusca = document.getElementById("input-busca");
    const btnBusca = document.getElementById("btn-busca");

    inputBusca.addEventListener("input", renderizarRestaurantesHome);
    btnBusca.addEventListener("click", renderizarRestaurantesHome);

    document.querySelectorAll("#filtros-categorias .filtro").forEach((btn) => {
        btn.onclick = () => {
            document.querySelectorAll("#filtros-categorias .filtro").forEach(b => b.classList.remove("ativo"));
            btn.classList.add("ativo");
            categoriaSelecionada = btn.dataset.categoria;
            renderizarRestaurantesHome();
        };
    });
}

function renderizarRestaurantesHome() {
    const container = document.getElementById("lista-restaurantes");
    const contador = document.getElementById("contador-restaurantes");
    const termo = (document.getElementById("input-busca")?.value || "").toLowerCase().trim();

    const filtrados = todosRestaurantes.filter((r) => {
        const bateNome =
            r.nome.toLowerCase().includes(termo) ||
            r.categoria.toLowerCase().includes(termo) ||
            (r.descricao && r.descricao.toLowerCase().includes(termo));

        const bateCategoria = !categoriaSelecionada || r.categoria === categoriaSelecionada;
        return bateNome && bateCategoria;
    });

    if (contador) {
        contador.textContent = `${filtrados.length} restaurante(s)`;
    }

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div class="vazio" style="grid-column: 1 / -1;">
                <h3>Nenhum restaurante encontrado</h3>
                <p>Tente buscar outro nome ou cadastre um restaurante na aba Gerenciar.</p>
                <a href="admin.html" class="btn btn-vermelho">Cadastrar Restaurante</a>
            </div>
        `;
        return;
    }

    container.innerHTML = filtrados
        .map(
            (r) => `
        <div class="card-restaurante" onclick="window.location.href='restaurante.html?id=${r.id}'">
            <img src="${r.imagem}" alt="${r.nome}">
            <div class="info">
                <div class="flex-entre mb-20" style="margin-bottom: 6px;">
                    <h3>${r.nome}</h3>
                    <span class="badge badge-vermelho">${r.categoria}</span>
                </div>
                <p>${r.descricao || "Delícias preparadas na hora."}</p>
                <div class="detalhes">
                    <span class="avaliacao">★ ${Number(r.avaliacao || 5).toFixed(1)}</span>
                    <span class="tempo">${r.tempoEntrega}</span>
                    <span>${Number(r.taxaEntrega) === 0 ? "Entrega Grátis" : "R$ " + Number(r.taxaEntrega).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `
        )
        .join("");
}

async function iniciarAdmin() {
    const formRest = document.getElementById("form-restaurante");
    const formPrato = document.getElementById("form-prato");
    if (!formRest || !formPrato) return;

    await carregarDadosAdmin();

    formRest.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("rest-id").value;
        const payload = {
            nome: document.getElementById("rest-nome").value,
            categoria: document.getElementById("rest-categoria").value,
            tempoEntrega: document.getElementById("rest-tempo").value,
            taxaEntrega: parseFloat(document.getElementById("rest-taxa").value) || 0,
            imagem: document.getElementById("rest-imagem").value,
            descricao: document.getElementById("rest-descricao").value
        };

        const url = id ? `/restaurantes/${id}` : "/restaurantes";
        const method = id ? "PUT" : "POST";

        const resp = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            resetarFormRestaurante();
            exibirAlerta("mensagem-admin", id ? "Restaurante atualizado!" : "Restaurante cadastrado!");
            await carregarDadosAdmin();
        }
    };

    document.getElementById("btn-cancelar-restaurante").onclick = resetarFormRestaurante;

    formPrato.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("prato-id").value;
        const payload = {
            restauranteId: document.getElementById("prato-restaurante").value,
            nome: document.getElementById("prato-nome").value,
            preco: parseFloat(document.getElementById("prato-preco").value),
            imagem: document.getElementById("prato-imagem").value,
            descricao: document.getElementById("prato-descricao").value
        };

        const url = id ? `/pratos/${id}` : "/pratos";
        const method = id ? "PUT" : "POST";

        const resp = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            resetarFormPrato();
            exibirAlerta("mensagem-admin", id ? "Prato atualizado!" : "Prato cadastrado!");
            await carregarDadosAdmin();
        }
    };

    document.getElementById("btn-cancelar-prato").onclick = resetarFormPrato;
}

async function carregarDadosAdmin() {
    const [respRest, respPratos] = await Promise.all([fetch("/restaurantes"), fetch("/pratos")]);
    const restaurantes = await respRest.json();
    const pratos = await respPratos.json();

    const selectRest = document.getElementById("prato-restaurante");
    selectRest.innerHTML =
        '<option value="">Selecione um restaurante...</option>' +
        restaurantes.map(r => `<option value="${r.id}">${r.nome}</option>`).join("");

    const listaRest = document.getElementById("admin-lista-restaurantes");
    listaRest.innerHTML = restaurantes.length
        ? restaurantes
              .map(
                  (r) => `
            <div class="card-restaurante" style="cursor: default;">
                <img src="${r.imagem}" alt="${r.nome}">
                <div class="info">
                    <h3>${r.nome}</h3>
                    <p>${r.categoria} • ${r.tempoEntrega}</p>
                    <div class="flex gap-10 mt-10">
                        <button class="btn btn-cinza" onclick='editarRestaurante(${JSON.stringify(r)})'>Editar</button>
                        <button class="btn btn-vermelho" onclick="excluirRestaurante(${r.id})">Excluir</button>
                    </div>
                </div>
            </div>
        `
              )
              .join("")
        : "<p>Nenhum restaurante cadastrado ainda.</p>";

    const listaPratos = document.getElementById("admin-lista-pratos");
    listaPratos.innerHTML = pratos.length
        ? pratos
              .map((p) => {
                  const dono = restaurantes.find(r => r.id == p.restauranteId);
                  return `
                <div class="card-prato">
                    <img src="${p.imagem}" alt="${p.nome}">
                    <div class="info">
                        <span class="badge badge-cinza mb-20" style="margin-bottom: 6px;">${dono ? dono.nome : "Restaurante"}</span>
                        <h3>${p.nome}</h3>
                        <p>${p.descricao || ""}</p>
                        <div class="preco">R$ ${Number(p.preco).toFixed(2)}</div>
                        <div class="flex gap-10 mt-10">
                            <button class="btn btn-cinza" onclick='editarPrato(${JSON.stringify(p)})'>Editar</button>
                            <button class="btn btn-vermelho" onclick="excluirPrato(${p.id})">Excluir</button>
                        </div>
                    </div>
                </div>
            `;
              })
              .join("")
        : "<p>Nenhum prato cadastrado ainda.</p>";
}

function editarRestaurante(r) {
    document.getElementById("rest-id").value = r.id;
    document.getElementById("rest-nome").value = r.nome;
    document.getElementById("rest-categoria").value = r.categoria;
    document.getElementById("rest-tempo").value = r.tempoEntrega;
    document.getElementById("rest-taxa").value = r.taxaEntrega;
    document.getElementById("rest-imagem").value = r.imagem;
    document.getElementById("rest-descricao").value = r.descricao || "";
    document.getElementById("btn-salvar-restaurante").textContent = "Atualizar Restaurante";
    document.getElementById("btn-cancelar-restaurante").classList.remove("oculto");
    document.getElementById("form-restaurante").scrollIntoView({ behavior: "smooth" });
}

function resetarFormRestaurante() {
    document.getElementById("form-restaurante").reset();
    document.getElementById("rest-id").value = "";
    document.getElementById("btn-salvar-restaurante").textContent = "Salvar Restaurante";
    document.getElementById("btn-cancelar-restaurante").classList.add("oculto");
}

async function excluirRestaurante(id) {
    const resp = await fetch(`/restaurantes/${id}`, { method: "DELETE" });
    if (resp.ok) {
        exibirAlerta("mensagem-admin", "Restaurante removido!");
        await carregarDadosAdmin();
    }
}

function editarPrato(p) {
    document.getElementById("prato-id").value = p.id;
    document.getElementById("prato-restaurante").value = p.restauranteId;
    document.getElementById("prato-nome").value = p.nome;
    document.getElementById("prato-preco").value = p.preco;
    document.getElementById("prato-imagem").value = p.imagem;
    document.getElementById("prato-descricao").value = p.descricao || "";
    document.getElementById("btn-salvar-prato").textContent = "Atualizar Prato";
    document.getElementById("btn-cancelar-prato").classList.remove("oculto");
    document.getElementById("form-prato").scrollIntoView({ behavior: "smooth" });
}

function resetarFormPrato() {
    document.getElementById("form-prato").reset();
    document.getElementById("prato-id").value = "";
    document.getElementById("btn-salvar-prato").textContent = "Salvar Prato";
    document.getElementById("btn-cancelar-prato").classList.add("oculto");
}

async function excluirPrato(id) {
    const resp = await fetch(`/pratos/${id}`, { method: "DELETE" });
    if (resp.ok) {
        exibirAlerta("mensagem-admin", "Prato removido!");
        await carregarDadosAdmin();
    }
}

let pratosDoRestauranteAtual = [];

function obterCarrinho() {
    const dados = localStorage.getItem("ifome_carrinho");
    return dados ? JSON.parse(dados) : [];
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("ifome_carrinho", JSON.stringify(carrinho));
    renderizarCarrinho();
}

async function iniciarPaginaRestaurante() {
    const listaPratosEl = document.getElementById("lista-pratos-restaurante");
    if (!listaPratosEl) return;

    const params = new URLSearchParams(window.location.search);
    const restauranteId = params.get("id");

    if (!restauranteId) {
        window.location.href = "index.html";
        return;
    }

    const [respRest, respPratos] = await Promise.all([
        fetch(`/restaurantes/${restauranteId}`),
        fetch(`/pratos?restauranteId=${restauranteId}`)
    ]);

    if (!respRest.ok) {
        window.location.href = "index.html";
        return;
    }

    const restaurante = await respRest.json();
    pratosDoRestauranteAtual = await respPratos.json();

    document.getElementById("rest-detalhe-nome").textContent = restaurante.nome;
    document.getElementById("rest-detalhe-categoria").textContent = restaurante.categoria;
    document.getElementById("rest-detalhe-descricao").textContent = restaurante.descricao || "Cardápio completo disponível abaixo.";
    document.getElementById("rest-detalhe-avaliacao").textContent = `★ ${Number(restaurante.avaliacao || 5).toFixed(1)}`;
    document.getElementById("rest-detalhe-tempo").textContent = restaurante.tempoEntrega;
    document.getElementById("rest-detalhe-taxa").textContent =
        Number(restaurante.taxaEntrega) === 0 ? "Entrega Grátis" : `Taxa: R$ ${Number(restaurante.taxaEntrega).toFixed(2)}`;
    document.getElementById("rest-detalhe-imagem").src = restaurante.imagem;

    atualizarBotaoFavorito(Number(restauranteId));
    document.getElementById("btn-favoritar-restaurante").onclick = () => alternarFavorito(Number(restauranteId));

    if (pratosDoRestauranteAtual.length === 0) {
        listaPratosEl.innerHTML = `
            <div class="vazio" style="grid-column: 1 / -1;">
                <h3>Nenhum prato cadastrado neste restaurante</h3>
                <p>Adicione pratos a este restaurante na tela Gerenciar Restaurantes.</p>
                <a href="admin.html" class="btn btn-vermelho">Ir para Gerenciar</a>
            </div>
        `;
    } else {
        listaPratosEl.innerHTML = pratosDoRestauranteAtual
            .map(
                (p) => `
            <div class="card-prato">
                <img src="${p.imagem}" alt="${p.nome}">
                <div class="info">
                    <h3>${p.nome}</h3>
                    <p>${p.descricao || ""}</p>
                    <div class="rodape">
                        <span class="preco">R$ ${Number(p.preco).toFixed(2)}</span>
                        <button type="button" class="adicionar" title="Adicionar ao carrinho" onclick="adicionarAoCarrinho(${p.id})">+</button>
                    </div>
                </div>
            </div>
        `
            )
            .join("");
    }

    renderizarCarrinho();

    document.getElementById("btn-limpar-carrinho").onclick = () => {
        salvarCarrinho([]);
    };

    document.getElementById("btn-finalizar-pedido").onclick = finalizarPedido;

    await carregarAvaliacoesRestaurante(restauranteId);

    document.getElementById("form-avaliacao").onsubmit = async (e) => {
        e.preventDefault();
        const usuario = obterUsuarioLogado();
        if (carrinho.length > 0 && carrinho.restauranteId !== prato.restauranteId) {
            if (!confirm("Limpar carrinho do outro restaurante antes de adicionar este prato?")) return;
            carrinho.length = 0;
        }


        const nota = Number(document.getElementById("avaliacao-nota").value);
        const comentario = document.getElementById("avaliacao-comentario").value;

        const resp = await fetch("/avaliacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                restauranteId: Number(restauranteId),
                usuarioId: usuario.id,
                usuarioNome: usuario.nome,
                nota,
                comentario
            })
        });

        if (resp.ok) {
            document.getElementById("form-avaliacao").reset();
            exibirAlerta("mensagem-pedido", "Avaliação enviada com sucesso!", "sucesso");
            await carregarAvaliacoesRestaurante(restauranteId);
            const respRestAtualizado = await fetch(`/restaurantes/${restauranteId}`);
            const restAtualizado = await respRestAtualizado.json();
            document.getElementById("rest-detalhe-avaliacao").textContent = `★ ${Number(restAtualizado.avaliacao).toFixed(1)}`;
        }
    };
}

function atualizarBotaoFavorito(restauranteId) {
    const btn = document.getElementById("btn-favoritar-restaurante");
    if (!btn) return;
    const usuario = obterUsuarioLogado();
    const favoritos = usuario?.favoritos || [];
    const ehFavorito = favoritos.includes(restauranteId);
    btn.textContent = ehFavorito ? "♥ Favoritado" : "♡ Favoritar";
}

async function alternarFavorito(restauranteId) {
    const usuario = obterUsuarioLogado();
    if (!usuario) {
        exibirAlerta("mensagem-pedido", "Faça login para favoritar restaurantes!", "aviso");
        return;
    }

    const resp = await fetch(`/usuarios/${usuario.id}/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restauranteId })
    });

    if (resp.ok) {
        const dados = await resp.json();
        usuario.favoritos = dados.favoritos;
        salvarUsuarioLogado(usuario);
        atualizarBotaoFavorito(restauranteId);
    }
}

async function carregarAvaliacoesRestaurante(restauranteId) {
    const container = document.getElementById("lista-avaliacoes");
    if (!container) return;

    const resp = await fetch(`/avaliacoes?restauranteId=${restauranteId}`);
    const avaliacoes = await resp.json();

    if (avaliacoes.length === 0) {
        container.innerHTML = `<p>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>`;
        return;
    }

    container.innerHTML = avaliacoes
        .slice()
        .reverse()
        .map(
            (a) => `
        <div class="card-avaliacao">
            <div class="topo">
                <strong>${a.usuarioNome}</strong>
                <span class="estrelas">${"★".repeat(a.nota)}${"☆".repeat(5 - a.nota)}</span>
            </div>
            <p>${a.comentario}</p>
            <small>${a.data}</small>
        </div>
    `
        )
        .join("");
}

function adicionarAoCarrinho(pratoId) {
    const prato = pratosDoRestauranteAtual.find(p => p.id === pratoId);
    if (!prato) return;

    const carrinho = obterCarrinho();
    const itemExistente = carrinho.find(item => item.id === pratoId);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: prato.id,
            restauranteId: prato.restauranteId,
            nome: prato.nome,
            preco: Number(prato.preco),
            imagem: prato.imagem,
            quantidade: 1
        });
    }

    salvarCarrinho(carrinho);
    exibirAlerta("mensagem-pedido", `"${prato.nome}" adicionado ao carrinho!`, "sucesso");
}

function alterarQuantidadeCarrinho(pratoId, delta) {
    let carrinho = obterCarrinho();
    const index = carrinho.findIndex(item => item.id === pratoId);
    if (index === -1) return;

    carrinho[index].quantidade += delta;
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }

    salvarCarrinho(carrinho);
}

function renderizarCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalEl = document.getElementById("valor-total-carrinho");
    if (!container || !totalEl) return;

    const carrinho = obterCarrinho();

    if (carrinho.length === 0) {
        container.innerHTML = `<p class="centralizado" style="padding: 20px 0;">Seu carrinho está vazio. Clique no botão <strong>+</strong> de um prato para adicionar.</p>`;
        totalEl.textContent = "R$ 0,00";
        return;
    }

    container.innerHTML = carrinho
        .map(
            (item) => `
        <div class="item-carrinho">
            <img src="${item.imagem}" alt="${item.nome}">
            <div class="descricao">
                <h4>${item.nome}</h4>
                <span class="preco">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
            <div class="quantidade">
                <button type="button" onclick="alterarQuantidadeCarrinho(${item.id}, -1)">-</button>
                <span><strong>${item.quantidade}</strong></span>
                <button type="button" onclick="alterarQuantidadeCarrinho(${item.id}, 1)">+</button>
            </div>
        </div>
    `
        )
        .join("");

    const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
    totalEl.textContent = `R$ ${total.toFixed(2)}`;
}

async function finalizarPedido() {
    const usuario = obterUsuarioLogado();
    if (!usuario) {
        exibirAlerta("mensagem-pedido", "Faça login antes de finalizar o pedido!", "aviso");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
    }

    const carrinho = obterCarrinho();
    if (carrinho.length === 0) {
        exibirAlerta("mensagem-pedido", "Adicione pelo menos um prato ao carrinho.", "aviso");
        return;
    }

    const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

    const resp = await fetch("/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuarioId: usuario.id,
            itens: carrinho,
            total
        })
    });

    if (resp.ok) {
        salvarCarrinho([]);
        exibirAlerta("mensagem-pedido", "Pedido finalizado com sucesso! Veja no seu perfil.", "sucesso");
    } else {
        exibirAlerta("mensagem-pedido", "Erro ao finalizar o pedido.", "erro");
    }
}

async function iniciarPerfil() {
    const listaPedidosEl = document.getElementById("perfil-lista-pedidos");
    if (!listaPedidosEl) return;

    const usuario = obterUsuarioLogado();
    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("perfil-nome").textContent = usuario.nome;
    document.getElementById("perfil-email").textContent = usuario.email;
    document.getElementById("perfil-endereco").textContent = usuario.endereco
        ? `Endereço: ${usuario.endereco}`
        : "Endereço não cadastrado";

    const [respPedidos, respRest] = await Promise.all([
        fetch(`/pedidos?usuarioId=${usuario.id}`),
        fetch("/restaurantes")
    ]);

    const pedidos = await respPedidos.json();
    const restaurantes = await respRest.json();

    const favoritosIds = usuario.favoritos || [];
    const favoritos = restaurantes.filter(r => favoritosIds.includes(r.id));
    const totalGasto = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);

    document.getElementById("stat-total-pedidos").textContent = pedidos.length;
    document.getElementById("stat-total-gasto").textContent = `R$ ${totalGasto.toFixed(2)}`;
    document.getElementById("stat-total-favoritos").textContent = favoritos.length;

    const listaFavoritosEl = document.getElementById("perfil-lista-favoritos");
    if (favoritos.length === 0) {
        listaFavoritosEl.innerHTML = `<p>Você ainda não favoritou nenhum restaurante.</p>`;
    } else {
        listaFavoritosEl.innerHTML = favoritos
            .map(
                (r) => `
            <div class="card-restaurante" onclick="window.location.href='restaurante.html?id=${r.id}'">
                <img src="${r.imagem}" alt="${r.nome}">
                <div class="info">
                    <div class="flex-entre mb-20" style="margin-bottom: 6px;">
                        <h3>${r.nome}</h3>
                        <span class="badge badge-vermelho">${r.categoria}</span>
                    </div>
                    <p>${r.descricao || ""}</p>
                    <div class="detalhes">
                        <span class="avaliacao">★ ${Number(r.avaliacao || 5).toFixed(1)}</span>
                        <span class="tempo">${r.tempoEntrega}</span>
                    </div>
                </div>
            </div>
        `
            )
            .join("");
    }

    if (pedidos.length === 0) {
        listaPedidosEl.innerHTML = `
            <div class="vazio">
                <h3>Nenhum pedido realizado</h3>
                <p>Explore os restaurantes e faça seu primeiro pedido!</p>
                <a href="index.html" class="btn btn-vermelho">Ver Restaurantes</a>
            </div>
        `;
    } else {
        listaPedidosEl.innerHTML = pedidos
            .slice()
            .reverse()
            .map(
                (p) => `
            <div class="card-pedido">
                <div class="topo">
                    <div>
                        <strong>Pedido #${p.id}</strong>
                        <p><small>${p.data}</small></p>
                    </div>
                    <span class="status">${p.status}</span>
                </div>
                <p>${p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ")}</p>
                <div class="mt-10">
                    <strong>Total: R$ ${Number(p.total).toFixed(2)}</strong>
                </div>
            </div>
        `
            )
            .join("");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarCabecalhoUsuario();
    iniciarLoginCadastro();
    iniciarHome();
    iniciarAdmin();
    iniciarPaginaRestaurante();
    iniciarPerfil();
});