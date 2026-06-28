// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE FABRICANTES (SUPABASE)
// =======================================================

let listaFabricantesLocal = [];

const formFabricante = document.getElementById('form-fabricante');
const tabelaFabricantesCorpo = document.getElementById('tabela-fabricantes-corpo');
const inputBuscaFabricante = document.getElementById('busca-fabricante');

document.addEventListener('DOMContentLoaded', () => {
    if (formFabricante) {
        formFabricante.addEventListener('submit', salvarFabricante);
    }
});

// Força a atualização da lista sempre que o painel de fabricantes for exibido
const funcaoMostrarTelaCadastroOriginalParaFab = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaFab(idCadastro);
    if (idCadastro === 'cadastro-fabricantes') {
        buscarFabricantesBanco();
    }
}

// 1. BUSCAR FABRICANTES DO BANCO DE DADOS
async function buscarFabricantesBanco() {
    console.log("Buscando lista de fabricantes no Supabase...");
    tabelaFabricantesCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando fabricantes...</td></tr>`;

    const { data: fabricantes, error } = await supabaseClient
        .from('fabricantes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar fabricantes:', error.message);
        alert('Erro ao carregar lista de fabricantes.');
        return;
    }

    listaFabricantesLocal = fabricantes;
    renderizarTabelaFabricantes(listaFabricantesLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaFabricantes(dados) {
    tabelaFabricantesCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaFabricantesCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Nenhuma fabricante cadastrada.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #0f172a;">${registro.fabricante}</td>
            <td>${registro.fab_cnpj}</td>
            <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:600; font-size:12px;">${registro.fab_inscricao_estadual}</span></td>
            <td>${registro.fab_cidade_estado}</td>
            <td style="font-size:13px; color:#475569;"><i class="fa-solid fa-user-tie" style="font-size:11px;"></i> ${registro.fab_representante}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoFabricante(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarFabricante(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirFabricante(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaFabricantesCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR FABRICANTE
async function salvarFabricante(e) {
    e.preventDefault();

    const id = document.getElementById('fabricante-id-oculto').value;
    const payload = {
        fabricante: document.getElementById('fab-nome').value.trim(),
        fab_cnpj: document.getElementById('fab-cnpj').value.trim(),
        fab_endereco: document.getElementById('fab-endereco').value.trim(),
        fab_cidade_estado: document.getElementById('fab-cidade-estado').value.trim(),
        fab_inscricao_estadual: document.getElementById('fab-ie').value.trim(),
        fab_telefone: document.getElementById('fab-tel').value.trim(),
        fab_email: document.getElementById('fab-email').value.trim(),
        fab_representante: document.getElementById('fab-rep-nome').value.trim(),
        fab_rep_doc: document.getElementById('fab-rep-doc').value.trim(),
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('fabricantes').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('fabricantes').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar fabricante:', resposta.error);
        alert('Erro ao processar dados da fabricante: ' + resposta.error.message);
    } else {
        alert(id ? 'Fabricante atualizada com sucesso!' : 'Fabricante cadastrada com sucesso!');
        limparFormularioFabricante();
        buscarFabricantesBanco();
    }
}

// 4. PESQUISAR / FILTRAR LOCALMENTE
function filtrarFabricantes() {
    const termo = inputBuscaFabricante.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaFabricantes(listaFabricantesLocal);
        return;
    }

    const filtrados = listaFabricantesLocal.filter(reg => {
        return (reg.fabricante && reg.fabricante.toLowerCase().includes(termo)) ||
               (reg.fab_cnpj && reg.fab_cnpj.toLowerCase().includes(termo)) ||
    });

    renderizarTabelaFabricantes(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoFabricante(id) {
    const trans = listaFabricantesLocal.find(reg => reg.id === id);
    if (!trans) return;

    document.getElementById('fabricante-id-oculto').value = trans.id;
    document.getElementById('fab-nome').value = trans.fabricante;
    document.getElementById('fab-cnpj').value = trans.trans_documento;
    document.getElementById('fab-ie').value = trans.trans_codigo;
    document.getElementById('fab-cidade-estado').value = trans.trans_cidade_estado;
    document.getElementById('trans-endereco').value = trans.trans_endereco;
    document.getElementById('rep-nome').value = trans.representante_transporte;
    document.getElementById('rep-doc').value = trans.representante_doc;

    document.getElementById('titulo-form-fabricante').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Fabricante: ${trans.fabricante}`;
    document.getElementById('btn-salvar-fabricante').textContent = "Atualizar Fabricante";
    document.getElementById('btn-cancelar-trans-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-fabricante').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR FABRICANTE (Útil se houver filiais com o mesmo representante/CNPJ base)
function duplicarFabricante(id) {
    const trans = listaFabricantesLocal.find(reg => reg.id === id);
    if (!trans) return;

    document.getElementById('fabricante-id-oculto').value = '';
    document.getElementById('fab-nome').value = trans.fabricante + " (CÓPIA)";
    document.getElementById('fab-cnpj').value = trans.trans_documento;
    document.getElementById('fab-ie').value = trans.trans_codigo;
    document.getElementById('fab-cidade-estado').value = trans.trans_cidade_estado;
    document.getElementById('trans-endereco').value = trans.trans_endereco;
    document.getElementById('rep-nome').value = trans.representante_transporte;
    document.getElementById('rep-doc').value = trans.representante_doc;

    document.getElementById('titulo-form-fabricante').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia da Fabricante`;
    document.getElementById('btn-salvar-fabricante').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-trans-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-fabricante').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR FABRICANTE
async function excluirFabricante(id) {
    const trans = listaFabricantesLocal.find(reg => reg.id === id);
    if (!trans) return;

    if (!confirm(`Tem certeza de que deseja excluir a fabricante "${trans.fabricante}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('fabricantes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir fabricante:', error);
        alert('Não foi possível deletar a fabricante: ' + error.message);
    } else {
        alert('Fabricante removida com sucesso.');
        buscarFabricantesBanco();
    }
}

function limparFormularioFabricante() {
    formFabricante.reset();
    document.getElementById('fabricante-id-oculto').value = '';
    document.getElementById('titulo-form-fabricante').innerHTML = `<i class="fa-solid fa-truck-ramp-box"></i> Cadastrar Nova Fabricante`;
    document.getElementById('btn-salvar-fabricante').textContent = "Salvar Fabricante";
    document.getElementById('btn-cancelar-trans-edicao').style.display = "none";
}
