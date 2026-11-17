# Ifome
Um site baseado na Ifood, com cadastro, crud, carrinho, historico

Etapa 1: Estrutura e Servidor

• Iniciar Servidor: Configurar o arquivo principal do servidor (ex: server.js com Express) para rodar localmente e servir os arquivos HTML.
• Banco/Arquivos: Criar arquivos .json (ou tabelas no banco) vazios para usuarios, restaurantes, pratos, pedidos e avaliacoes.
• Telas Base (HTML): Criar os arquivos index.html (Home), login.html, restaurante.html, admin.html (CRUD) e perfil.html.

Etapa 2: Usuários e Catálogo

• Cadastro/Login:
	• HTML/JS: Formulário capturando dados e enviando via fetch() (POST).
	• Servidor: Rota para gravar novo usuário e validar login (salvando o ID do usuário logado no localStorage do navegador).
• CRUD de Restaurantes e Pratos:
	• HTML/JS: Formulários na tela admin.html para criar, editar e botões para excluir (POST, PUT, DELETE).
	• Servidor: Rotas de API que recebem esses dados e atualizam a lista de restaurantes e seus respectivos pratos.
• Catálogo e Pesquisa (Home):
	• Servidor: Rota GET /restaurantes que devolve todos os restaurantes cadastrados.
	• HTML/JS: Fazer fetch() ao abrir a página, gerar os cards na tela via manipulação de DOM e usar .filter() no JS para filtrar pelo nome digitado na barra de busca.

Etapa 3: Cardápio e Carrinho

• Página do Restaurante:
	• HTML/JS: Pegar o ID do restaurante pela URL, buscar seus pratos no servidor (GET) e renderizar a lista com botões de "Adicionar ao carrinho".
• Lógica do Carrinho:
	• JS (Front-end): Criar um array no localStorage para guardar os pratos escolhidos, somar os preços com .reduce() e atualizar a tela (aumentar/diminuir quantidade).
• Fechar Pedido:
	• HTML/JS: Botão "Finalizar" que envia o array do carrinho + ID do usuário para o servidor (POST /pedidos).
	• Servidor: Rota que salva o pedido no histórico e limpa o carrinho no front-end.

Etapa 4: Interação e Perfil

• Favoritar Restaurantes:
	• HTML/JS: Botão de coração/estrela que dispara um POST /favoritos enviando o ID do usuário e do restaurante.
	• Servidor: Salvar ou remover esse vínculo na lista de favoritos do usuário.
• Avaliações e Comentários:
	• HTML/JS: Campo de texto e nota na tela do restaurante (POST /avaliacoes) + exibição dos comentários já feitos (GET).
	• Servidor: Rotas para salvar e listar os comentários vinculados ao ID daquele restaurante.
• Perfil e Estatísticas:
	• Servidor: Rota GET /perfil/:id que busca os pedidos e favoritos daquele usuário.
	• JS (Front-end): Renderizar o histórico na tela e calcular estatísticas simples usando JS (ex: pedidos.length para total de pedidos e soma dos valores para total gasto).
