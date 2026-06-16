// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE IMPORTADORES (SUPABASE)
// =======================================================

let listaImportadoresLocal = [];

const formImportador = document.getElementById('form-importador');
const tabelaImportadoresCorpo = document.getElementById('tabela-importadores-corpo');
const inputBuscaImportador = document.getElementById('busca-importador');

document.addEventListener('DOMContentLoaded', () => {
    if (formImportador) {
        formImportador.addEventListener('submit', salvarImportador);
    }
});

// Atualiza a lista sempre que a tela de importadores for aberta
const funcaoMostrarTelaCadastroOriginalParaImp = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaImp(idCadastro);
    if (idCadastro === 'cadastro-importadores') {
        buscarImportadoresBanco();
    }
}

// 1. BUSCAR IMPORTADORES DO BANCO DE DADOS
async function buscarImportadoresBanco() {
    console.log("Buscando lista de importadores no Supabase...");
    tabelaImportadoresCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando importadores...</td></tr>`;

    const { data: importadores, error } = await supabaseClient
        .from('importadores')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar importadores:', error.message);
        alert('Erro ao carregar lista de importadores.');
        return;
    }

    listaImportadoresLocal = importadores;
    renderizarTabelaImportadores(listaImportadoresLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaImportadores(dados) {
    tabelaImportadoresCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaImportadoresCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Nenhum importador cadastrado.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #0f172a;">${registro.importador}</td>
            <td>${registro.imp_documento}</td>
            <td><span style="background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:600;">${registro.imp_cidade_estado}</span></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${registro.imp_endereco}</td>
            <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12px;">${registro.prazo_pagamento}</span></td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoImportador(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarImportador(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirImportador(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaImportadoresCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR IMPORTADOR
async function salvarImportador(e) {
    e.preventDefault();

    const id = document.getElementById('importador-id-oculto').value;
    const payload = {
        importador: document.getElementById('imp-nome').value.trim(),
        imp_documento: document.getElementById('imp-documento').value.trim(),
        imp_cidade_estado: document.getElementById('imp-cidade-estado').value.trim(),
        imp_endereco: document.getElementById('imp-endereco').value.trim(),
        prazo_pagamento: document.getElementById('imp-prazo').value.trim()
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('importadores').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('importadores').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar importador:', resposta.error);
        alert('Erro ao processar dados do importador: ' + resposta.error.message);
    } else {
        alert(id ? 'Importador atualizado com sucesso!' : 'Importador cadastrado com sucesso!');
        limparFormularioImportador();
        buscarImportadoresBanco();
    }
}

// 4. PESQUISAR / FILTRAR LOCALMENTE
function filtrarImportadores() {
    const termo = inputBuscaImportador.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaImportadores(listaImportadoresLocal);
        return;
    }

    const filtrados = listaImportadoresLocal.filter(reg => {
        return (reg.importador && reg.importador.toLowerCase().includes(termo)) ||
               (reg.imp_documento && reg.imp_documento.toLowerCase().includes(termo)) ||
               (reg.imp_cidade_estado && reg.imp_cidade_estado.toLowerCase().includes(termo)) ||
               (reg.prazo_pagamento && reg.prazo_pagamento.toLowerCase().includes(termo));
    });

    renderizarTabelaImportadores(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoImportador(id) {
    const imp = listaImportadoresLocal.find(reg => reg.id === id);
    if (!imp) return;

    document.getElementById('importador-id-oculto').value = imp.id;
    document.getElementById('imp-nome').value = imp.importador;
    document.getElementById('imp-documento').value = imp.imp_documento;
    document.getElementById('imp-cidade-estado').value = imp.imp_cidade_estado;
    document.getElementById('imp-endereco').value = imp.imp_endereco;
    document.getElementById('imp-prazo').value = imp.prazo_pagamento;

    document.getElementById('titulo-form-importador').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Importador: ${imp.importador}`;
    document.getElementById('btn-salvar-importador').textContent = "Atualizar Importador";
    document.getElementById('btn-cancelar-imp-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-importador').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR IMPORTADOR
function duplicarImportador(id) {
    const imp = listaImportadoresLocal.find(reg => reg.id === id);
    if (!imp) return;

    document.getElementById('importador-id-oculto').value = '';
    document.getElementById('imp-nome').value = imp.importador + " (CÓPIA)";
    document.getElementById('imp-documento').value = imp.imp_documento;
    document.getElementById('imp-cidade-estado').value = imp.imp_cidade_estado;
    document.getElementById('imp-endereco').value = imp.imp_endereco;
    document.getElementById('imp-prazo').value = imp.prazo_pagamento;

    document.getElementById('titulo-form-importador').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia do Importador`;
    document.getElementById('btn-salvar-importador').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-imp-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-importador').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR IMPORTADOR
async function excluirImportador(id) {
    const imp = listaImportadoresLocal.find(reg => reg.id === id);
    if (!imp) return;

    if (!confirm(`Tem certeza de que deseja excluir o importador "${imp.importador}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('importadores')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir importador:', error);
        alert('Não foi possível deletar o importador: ' + error.message);
    } else {
        alert('Importador removido com sucesso.');
        buscarImportadoresBanco();
    }
}

function limparFormularioImportador() {
    formImportador.reset();
    document.getElementById('importador-id-oculto').value = '';
    document.getElementById('titulo-form-importador').innerHTML = `<i class="fa-solid fa-arrow-down-left-and-arrow-up-right-to-square"></i> Cadastrar Novo Importador`;
    document.getElementById('btn-salvar-importador').textContent = "Salvar Importador";
    document.getElementById('btn-cancelar-imp-edicao').style.display = "none";
}
