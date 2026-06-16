// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE MOTORISTAS (SUPABASE)
// =======================================================

let listaMotoristasLocal = [];

const formMotorista = document.getElementById('form-motorista');
const tabelaMotoristasCorpo = document.getElementById('tabela-motoristas-corpo');
const inputBuscaMotorista = document.getElementById('busca-motorista');

document.addEventListener('DOMContentLoaded', () => {
    if (formMotorista) {
        formMotorista.addEventListener('submit', salvarMotorista);
    }
});

// Intercepta a abertura de telas para atualizar os dados de motoristas quando clicado
const funcaoMostrarTelaCadastroOriginalParaMoto = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaMoto(idCadastro);
    if (idCadastro === 'cadastro-motoristas') {
        buscarMotoristasBanco();
    }
}

// 1. BUSCAR MOTORISTAS DO BANCO DE DADOS
async function buscarMotoristasBanco() {
    console.log("Buscando lista de motoristas no Supabase...");
    tabelaMotoristasCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando motoristas...</td></tr>`;

    const { data: motoristas, error } = await supabaseClient
        .from('motoristas')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar motoristas:', error.message);
        alert('Erro ao carregar lista de motoristas.');
        return;
    }

    listaMotoristasLocal = motoristas;
    renderizarTabelaMotoristas(listaMotoristasLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaMotoristas(dados) {
    tabelaMotoristasCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaMotoristasCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Nenhum motorista encontrado.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${registro.nome_completo}</td>
            <td>${registro.doc_pessoal}</td>
            <td>${registro.nacionalidade || '-'}</td>
            <td>${registro.cnh || '-'}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoMotorista(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarMotorista(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirMotorista(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaMotoristasCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR MOTORISTA
async function salvarMotorista(e) {
    e.preventDefault();

    const id = document.getElementById('motorista-id-oculto').value;
    const payload = {
        nome_completo: document.getElementById('moto-nome').value,
        doc_pessoal: document.getElementById('moto-doc').value,
        nacionalidade: document.getElementById('moto-nacionalidade').value,
        cnh: document.getElementById('moto-cnh').value
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('motoristas').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('motoristas').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar motorista:', resposta.error);
        alert('Erro ao processar dados do motorista: ' + resposta.error.message);
    } else {
        alert(id ? 'Motorista atualizado com sucesso!' : 'Motorista cadastrado com sucesso!');
        limparFormularioMotorista();
        buscarMotoristasBanco();
    }
}

// 4. PESQUISAR / FILTRAR MOTORISTAS LOCALMENTE
function filtrarMotoristas() {
    const termo = inputBuscaMotorista.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaMotoristas(listaMotoristasLocal);
        return;
    }

    const filtrados = listaMotoristasLocal.filter(reg => {
        return (reg.nome_completo && reg.nome_completo.toLowerCase().includes(termo)) ||
               (reg.doc_pessoal && reg.doc_pessoal.toLowerCase().includes(termo)) ||
               (reg.cnh && reg.cnh.toLowerCase().includes(termo)) ||
               (reg.nacionalidade && reg.nacionalidade.toLowerCase().includes(termo));
    });

    renderizarTabelaMotoristas(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoMotorista(id) {
    const moto = listaMotoristasLocal.find(reg => reg.id === id);
    if (!moto) return;

    document.getElementById('motorista-id-oculto').value = moto.id;
    document.getElementById('moto-nome').value = moto.nome_completo;
    document.getElementById('moto-doc').value = moto.doc_pessoal;
    document.getElementById('moto-nacionalidade').value = moto.nacionalidade || '';
    document.getElementById('moto-cnh').value = moto.cnh || '';

    document.getElementById('titulo-form-motorista').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Motorista (ID: ${id})`;
    document.getElementById('btn-salvar-motorista').textContent = "Atualizar Dados";
    document.getElementById('btn-cancelar-moto-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-motorista').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR MOTORISTA
function duplicarMotorista(id) {
    const moto = listaMotoristasLocal.find(reg => reg.id === id);
    if (!moto) return;

    document.getElementById('motorista-id-oculto').value = '';
    document.getElementById('moto-nome').value = moto.nome_completo + " (CÓPIA)";
    document.getElementById('moto-doc').value = moto.doc_pessoal;
    document.getElementById('moto-nacionalidade').value = moto.nacionalidade || '';
    document.getElementById('moto-cnh').value = moto.cnh || '';

    document.getElementById('titulo-form-motorista').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia do Motorista`;
    document.getElementById('btn-salvar-motorista').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-moto-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-motorista').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR MOTORISTA
async function excluirMotorista(id) {
    const moto = listaMotoristasLocal.find(reg => reg.id === id);
    if (!moto) return;

    if (!confirm(`Tem certeza de que deseja excluir o motorista "${moto.nome_completo}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('motoristas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir motorista:', error);
        alert('Não foi possível deletar o motorista: ' + error.message);
    } else {
        alert('Motorista excluído com sucesso.');
        buscarMotoristasBanco();
    }
}

function limparFormularioMotorista() {
    formMotorista.reset();
    document.getElementById('motorista-id-oculto').value = '';
    document.getElementById('titulo-form-motorista').innerHTML = `<i class="fa-solid fa-id-card"></i> Cadastrar Novo Motorista`;
    document.getElementById('btn-salvar-motorista').textContent = "Salvar Motorista";
    document.getElementById('btn-cancelar-moto-edicao').style.display = "none";
}
