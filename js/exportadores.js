// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE EXPORTADORES (SUPABASE)
// =======================================================

let listaExportadoresLocal = [];

const formExportador = document.getElementById('form-exportador');
const tabelaExportadoresCorpo = document.getElementById('tabela-exportadores-corpo');
const inputBuscaExportador = document.getElementById('busca-exportador');

document.addEventListener('DOMContentLoaded', () => {
    if (formExportador) {
        formExportador.addEventListener('submit', salvarExportador);
    }
});

// Intercepta a abertura de telas para atualizar os dados sempre que a tela for acessada
const funcaoMostrarTelaCadastroOriginalParaExp = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaExp(idCadastro);
    if (idCadastro === 'cadastro-exportadores') {
        buscarExportadoresBanco();
    }
}

// 1. BUSCAR EXPORTADORES DO BANCO DE DADOS
async function buscarExportadoresBanco() {
    console.log("Buscando lista de exportadores no Supabase...");
    tabelaExportadoresCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando exportadores...</td></tr>`;

    const { data: exportadores, error } = await supabaseClient
        .from('exportadores')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar exportadores:', error.message);
        alert('Erro ao carregar lista de exportadores.');
        return;
    }

    listaExportadoresLocal = exportadores;
    renderizarTabelaExportadores(listaExportadoresLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaExportadores(dados) {
    tabelaExportadoresCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaExportadoresCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Nenhum exportador cadastrado.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #0f172a;">${registro.exportador}</td>
            <td>${registro.exp_cnpj}</td>
            <td><span style="background:#f0fdf4; color:#166534; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:600;">${registro.exp_cidade_estado}</span></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${registro.exp_endereco}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoExportador(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarExportador(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirExportador(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaExportadoresCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR EXPORTADOR
async function salvarExportador(e) {
    e.preventDefault();

    const id = document.getElementById('exportador-id-oculto').value;
    const payload = {
        exportador: document.getElementById('exp-nome').value.trim(),
        exp_cnpj: document.getElementById('exp-cnpj').value.trim(),
        exp_cidade_estado: document.getElementById('exp-cidade-estado').value.trim(),
        exp_endereco: document.getElementById('exp-endereco').value.trim()
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('exportadores').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('exportadores').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar exportador:', resposta.error);
        alert('Erro ao processar dados do exportador: ' + resposta.error.message);
    } else {
        alert(id ? 'Exportador atualizado com sucesso!' : 'Exportador cadastrado com sucesso!');
        limparFormularioExportador();
        buscarExportadoresBanco();
    }
}

// 4. PESQUISAR / FILTRAR EXPORTADORES LOCALMENTE
function filtrarExportadores() {
    const termo = inputBuscaExportador.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaExportadores(listaExportadoresLocal);
        return;
    }

    const filtrados = listaExportadoresLocal.filter(reg => {
        return (reg.exportador && reg.exportador.toLowerCase().includes(termo)) ||
               (reg.exp_cnpj && reg.exp_cnpj.toLowerCase().includes(termo)) ||
               (reg.exp_cidade_estado && reg.exp_cidade_estado.toLowerCase().includes(termo)) ||
               (reg.exp_endereco && reg.exp_endereco.toLowerCase().includes(termo));
    });

    renderizarTabelaExportadores(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoExportador(id) {
    const exp = listaExportadoresLocal.find(reg => reg.id === id);
    if (!exp) return;

    document.getElementById('exportador-id-oculto').value = exp.id;
    document.getElementById('exp-nome').value = exp.exportador;
    document.getElementById('exp-cnpj').value = exp.exp_cnpj;
    document.getElementById('exp-cidade-estado').value = exp.exp_cidade_estado;
    document.getElementById('exp-endereco').value = exp.exp_endereco;

    document.getElementById('titulo-form-exportador').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Exportador: ${exp.exportador}`;
    document.getElementById('btn-salvar-exportador').textContent = "Atualizar Exportador";
    document.getElementById('btn-cancelar-exp-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-exportador').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR EXPORTADOR
function duplicarExportador(id) {
    const exp = listaExportadoresLocal.find(reg => reg.id === id);
    if (!exp) return;

    document.getElementById('exportador-id-oculto').value = '';
    document.getElementById('exp-nome').value = exp.exportador + " (CÓPIA)";
    document.getElementById('exp-cnpj').value = exp.exp_cnpj;
    document.getElementById('exp-cidade-estado').value = exp.exp_cidade_estado;
    document.getElementById('exp-endereco').value = exp.exp_endereco;

    document.getElementById('titulo-form-exportador').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia do Exportador`;
    document.getElementById('btn-salvar-exportador').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-exp-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-exportador').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR EXPORTADOR
async function excluirExportador(id) {
    const exp = listaExportadoresLocal.find(reg => reg.id === id);
    if (!exp) return;

    if (!confirm(`Tem certeza de que deseja excluir o exportador "${exp.exportador}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('exportadores')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir exportador:', error);
        alert('Não foi possível deletar o exportador: ' + error.message);
    } else {
        alert('Exportador removido com sucesso.');
        buscarExportadoresBanco();
    }
}

function limparFormularioExportador() {
    formExportador.reset();
    document.getElementById('exportador-id-oculto').value = '';
    document.getElementById('titulo-form-exportador').innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> Cadastrar Novo Exportador`;
    document.getElementById('btn-salvar-exportador').textContent = "Salvar Exportador";
    document.getElementById('btn-cancelar-exp-edicao').style.display = "none";
}
