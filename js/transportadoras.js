// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE TRANSPORTADORAS (SUPABASE)
// =======================================================

let listaTransportadorasLocal = [];

const formTransportadora = document.getElementById('form-transportadora');
const tabelaTransportadorasCorpo = document.getElementById('tabela-transportadoras-corpo');
const inputBuscaTransportadora = document.getElementById('busca-transportadora');

document.addEventListener('DOMContentLoaded', () => {
    if (formTransportadora) {
        formTransportadora.addEventListener('submit', salvarTransportadora);
    }
});

// Força a atualização da lista sempre que o painel de transportadoras for exibido
const funcaoMostrarTelaCadastroOriginalParaTrans = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaTrans(idCadastro);
    if (idCadastro === 'cadastro-transportadoras') {
        buscarTransportadorasBanco();
    }
}

// 1. BUSCAR TRANSPORTADORAS DO BANCO DE DADOS
async function buscarTransportadorasBanco() {
    console.log("Buscando lista de transportadoras no Supabase...");
    tabelaTransportadorasCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando transportadoras...</td></tr>`;

    const { data: transportadoras, error } = await supabaseClient
        .from('transportadoras')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar transportadoras:', error.message);
        alert('Erro ao carregar lista de transportadoras.');
        return;
    }

    listaTransportadorasLocal = transportadoras;
    renderizarTabelaTransportadoras(listaTransportadorasLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaTransportadoras(dados) {
    tabelaTransportadorasCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaTransportadorasCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Nenhuma transportadora cadastrada.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #0f172a;">${registro.transportadora}</td>
            <td>${registro.trans_documento}</td>
            <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:600; font-size:12px;">${registro.trans_codigo}</span></td>
            <td>${registro.trans_cidade_estado}</td>
            <td style="font-size:13px; color:#475569;"><i class="fa-solid fa-user-tie" style="font-size:11px;"></i> ${registro.representante_transporte}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoTransportadora(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarTransportadora(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirTransportadora(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaTransportadorasCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR TRANSPORTADORA
async function salvarTransportadora(e) {
    e.preventDefault();

    const id = document.getElementById('transportadora-id-oculto').value;
    const payload = {
        transportadora: document.getElementById('trans-nome').value.trim(),
        trans_documento: document.getElementById('trans-doc').value.trim(),
        trans_codigo: document.getElementById('trans-codigo').value.trim(),
        trans_cidade_estado: document.getElementById('trans-cidade-estado').value.trim(),
        trans_endereco: document.getElementById('trans-endereco').value.trim(),
        representante_transporte: document.getElementById('rep-nome').value.trim(),
        representante_doc: document.getElementById('rep-doc').value.trim()
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('transportadoras').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('transportadoras').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar transportadora:', resposta.error);
        alert('Erro ao processar dados da transportadora: ' + resposta.error.message);
    } else {
        alert(id ? 'Transportadora atualizada com sucesso!' : 'Transportadora cadastrada com sucesso!');
        limparFormularioTransportadora();
        buscarTransportadorasBanco();
    }
}

// 4. PESQUISAR / FILTRAR LOCALMENTE
function filtrarTransportadoras() {
    const termo = inputBuscaTransportadora.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaTransportadoras(listaTransportadorasLocal);
        return;
    }

    const filtrados = listaTransportadorasLocal.filter(reg => {
        return (reg.transportadora && reg.transportadora.toLowerCase().includes(termo)) ||
               (reg.trans_documento && reg.trans_documento.toLowerCase().includes(termo)) ||
               (reg.trans_codigo && reg.trans_codigo.toLowerCase().includes(termo)) ||
               (reg.representante_transporte && reg.representante_transporte.toLowerCase().includes(termo));
    });

    renderizarTabelaTransportadoras(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoTransportadora(id) {
    const trans = listaTransportadorasLocal.find(reg => reg.id === id);
    if (!trans) return;

    document.getElementById('transportadora-id-oculto').value = trans.id;
    document.getElementById('trans-nome').value = trans.transportadora;
    document.getElementById('trans-doc').value = trans.trans_documento;
    document.getElementById('trans-codigo').value = trans.trans_codigo;
    document.getElementById('trans-cidade-estado').value = trans.trans_cidade_estado;
    document.getElementById('trans-endereco').value = trans.trans_endereco;
    document.getElementById('rep-nome').value = trans.representante_transporte;
    document.getElementById('rep-doc').value = trans.representante_doc;

    document.getElementById('titulo-form-transportadora').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Transportadora: ${trans.transportadora}`;
    document.getElementById('btn-salvar-transportadora').textContent = "Atualizar Transportadora";
    document.getElementById('btn-cancelar-trans-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-transportadora').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR TRANSPORTADORA (Útil se houver filiais com o mesmo representante/CNPJ base)
function duplicarTransportadora(id) {
    const trans = listaTransportadorasLocal.find(reg => reg.id === id);
    if (!trans) return;

    document.getElementById('transportadora-id-oculto').value = '';
    document.getElementById('trans-nome').value = trans.transportadora + " (CÓPIA)";
    document.getElementById('trans-doc').value = trans.trans_documento;
    document.getElementById('trans-codigo').value = trans.trans_codigo;
    document.getElementById('trans-cidade-estado').value = trans.trans_cidade_estado;
    document.getElementById('trans-endereco').value = trans.trans_endereco;
    document.getElementById('rep-nome').value = trans.representante_transporte;
    document.getElementById('rep-doc').value = trans.representante_doc;

    document.getElementById('titulo-form-transportadora').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia da Transportadora`;
    document.getElementById('btn-salvar-transportadora').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-trans-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-transportadora').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR TRANSPORTADORA
async function excluirTransportadora(id) {
    const trans = listaTransportadorasLocal.find(reg => reg.id === id);
    if (!trans) return;

    if (!confirm(`Tem certeza de que deseja excluir a transportadora "${trans.transportadora}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('transportadoras')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir transportadora:', error);
        alert('Não foi possível deletar a transportadora: ' + error.message);
    } else {
        alert('Transportadora removida com sucesso.');
        buscarTransportadorasBanco();
    }
}

function limparFormularioTransportadora() {
    formTransportadora.reset();
    document.getElementById('transportadora-id-oculto').value = '';
    document.getElementById('titulo-form-transportadora').innerHTML = `<i class="fa-solid fa-truck-ramp-box"></i> Cadastrar Nova Transportadora`;
    document.getElementById('btn-salvar-transportadora').textContent = "Salvar Transportadora";
    document.getElementById('btn-cancelar-trans-edicao').style.display = "none";
}
