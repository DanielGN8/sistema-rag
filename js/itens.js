// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE ITENS (SUPABASE)
// =======================================================

// Array global para guardar os itens na memória e facilitar a busca local por filtro
let listaItensLocal = [];

// Elementos capturados da tela de Itens
const formItem = document.getElementById('form-item');
const tabelaItensCorpo = document.getElementById('tabela-itens-corpo');
const inputBusca = document.getElementById('busca-item');

// Registra os gatilhos quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    if (formItem) {
        formItem.addEventListener('submit', salvarItem);
    }
});

// Sobrescrevemos a função mostrarTelaCadastro original para puxar os itens do banco ao abrir a tela
const funcaoMostrarTelaCadastroOriginal = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginal(idCadastro);
    if (idCadastro === 'cadastro-itens') {
        buscarItensBanco();
    }
}

// 1. BUSCAR ITENS DO BANCO DE DADOS
async function buscarItensBanco() {
    console.log("Buscando lista de itens no Supabase...");
    tabelaItensCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando itens...</td></tr>`;

    const { data: itens, error } = await supabaseClient
        .from('itens')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar itens:', error.message);
        alert('Erro ao carregar lista de itens.');
        return;
    }

    listaItensLocal = itens; // Salva na memória para o filtro rápido funcionar instantâneo
    renderizarTabelaItens(listaItensLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaItens(dados) {
    tabelaItensCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaItensCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Nenhum item encontrado.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${registro.item}</td>
            <td><span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:12px;">${registro.unidade}</span></td>
            <td>${registro.ncm}</td>
            <td>${registro.tipo_item || '-'}</td>
            <td>${registro.fabricante || '-'}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoItem(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarItem(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirItem(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaItensCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR ITEM
async function salvarItem(e) {
    e.preventDefault();

    const id = document.getElementById('item-id-oculto').value;
    const payload = {
        item: document.getElementById('item-nome').value,
        unidade: document.getElementById('item-unidade').value,
        ncm: document.getElementById('item-ncm').value,
        tipo_item: document.getElementById('item-tipo').value,
        processo_prod: document.getElementById('item-processo').value,
        codigo_fabricante: document.getElementById('item-cod-fabricante').value,
        fabricante: document.getElementById('item-fabricante').value
    };

    let resposta;

    if (id) {
        // Modo Edição: Atualiza a linha existente
        resposta = await supabaseClient.from('itens').update([payload]).eq('id', id).select();
    } else {
        // Modo Cadastro: Insere nova linha
        resposta = await supabaseClient.from('itens').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro operacional no Supabase:', resposta.error);
        alert('Erro ao processar dados do item: ' + resposta.error.message);
    } else {
        alert(id ? 'Item atualizado com sucesso!' : 'Item cadastrado com sucesso!');
        limparFormularioItem();
        buscarItensBanco();
    }
}

// 4. PESQUISAR / FILTRAR ITENS LOCALMENTE (Filtro instantâneo sem gastar requisições do banco)
function filtrarItens() {
    const termo = inputBusca.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaItens(listaItensLocal);
        return;
    }

    const filtrados = listaItensLocal.filter(reg => {
        return (reg.item && reg.item.toLowerCase().includes(termo)) ||
               (reg.ncm && reg.ncm.toLowerCase().includes(termo)) ||
               (reg.fabricante && reg.fabricante.toLowerCase().includes(termo)) ||
               (reg.tipo_item && reg.tipo_item.toLowerCase().includes(termo));
    });

    renderizarTabelaItens(filtrados);
}

// 5. CARREGAR DADOS NO FORMULÁRIO PARA EDIÇÃO
function prepararEdicaoItem(id) {
    const itemEncontrado = listaItensLocal.find(reg => reg.id === id);
    if (!itemEncontrado) return;

    document.getElementById('item-id-oculto').value = itemEncontrado.id;
    document.getElementById('item-nome').value = itemEncontrado.item;
    document.getElementById('item-unidade').value = itemEncontrado.unidade;
    document.getElementById('item-ncm').value = itemEncontrado.ncm;
    document.getElementById('item-tipo').value = itemEncontrado.tipo_item || '';
    document.getElementById('item-processo').value = itemEncontrado.processo_prod || '';
    document.getElementById('item-cod-fabricante').value = itemEncontrado.codigo_fabricante || '';
    document.getElementById('item-fabricante').value = itemEncontrado.fabricante || '';

    // Muda a interface para avisar que está editando
    document.getElementById('titulo-form-item').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Item (ID: ${id})`;
    document.getElementById('btn-salvar-item').textContent = "Atualizar Dados";
    document.getElementById('btn-cancelar-edicao').style.display = "inline-block";
    
    // Sobe a tela suavemente para o usuário ver o formulário preenchido
    document.getElementById('titulo-form-item').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR ITEM
function duplicarItem(id) {
    const itemAlvo = listaItensLocal.find(reg => reg.id === id);
    if (!itemAlvo) return;

    // Preenche o formulário mas NÃO coloca a ID oculta (assim o banco entende como novo item)
    document.getElementById('item-id-oculto').value = '';
    document.getElementById('item-nome').value = itemAlvo.item + " (CÓPIA)";
    document.getElementById('item-unidade').value = itemAlvo.unidade;
    document.getElementById('item-ncm').value = itemAlvo.ncm;
    document.getElementById('item-tipo').value = itemAlvo.tipo_item || '';
    document.getElementById('item-processo').value = itemAlvo.processo_prod || '';
    document.getElementById('item-cod-fabricante').value = itemAlvo.codigo_fabricante || '';
    document.getElementById('item-fabricante').value = itemAlvo.fabricante || '';

    document.getElementById('titulo-form-item').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia do Item`;
    document.getElementById('btn-salvar-item').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-item').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR ITEM
async function excluirItem(id) {
    const itemAlvo = listaItensLocal.find(reg => reg.id === id);
    if (!itemAlvo) return;

    if (!confirm(`Tem certeza absoluta de que deseja excluir o item "${itemAlvo.item}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('itens')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir do Supabase:', error);
        alert('Não foi possível deletar o item: ' + error.message);
    } else {
        alert('Item excluído com sucesso.');
        buscarItensBanco();
    }
}

// Helper para resetar os campos
function limparFormularioItem() {
    formItem.reset();
    document.getElementById('item-id-oculto').value = '';
    document.getElementById('titulo-form-item').innerHTML = `<i class="fa-solid fa-box"></i> Cadastrar Novo Item`;
    document.getElementById('btn-salvar-item').textContent = "Salvar Item";
    document.getElementById('btn-cancelar-edicao').style.display = "none";
}
