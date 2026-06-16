// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE CAMINHÕES (SUPABASE)
// =======================================================

let listaCaminhoesLocal = [];

const formCaminhao = document.getElementById('form-caminhao');
const tabelaCaminhoesCorpo = document.getElementById('tabela-caminhoes-corpo');
const inputBuscaCaminhao = document.getElementById('busca-caminhao');

document.addEventListener('DOMContentLoaded', () => {
    if (formCaminhao) {
        formCaminhao.addEventListener('submit', salvarCaminhao);
    }
});

// Intercepta a abertura de telas para atualizar a lista sempre que o painel for aberto
const funcaoMostrarTelaCadastroOriginalParaCam = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaCam(idCadastro);
    if (idCadastro === 'cadastro-caminhoes') {
        buscarCaminhoesBanco();
    }
}

// 1. BUSCAR CAMINHÕES DO BANCO DE DADOS
async function buscarCaminhoesBanco() {
    console.log("Buscando lista de caminhões no Supabase...");
    tabelaCaminhoesCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando frota...</td></tr>`;

    const { data: caminhoes, error } = await supabaseClient
        .from('caminhoes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar caminhões:', error.message);
        alert('Erro ao carregar lista de caminhões.');
        return;
    }

    listaCaminhoesLocal = caminhoes;
    renderizarTabelaCaminhoes(listaCaminhoesLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaCaminhoes(dados) {
    tabelaCaminhoesCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaCaminhoesCorpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Nenhum caminhão cadastrado.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #1e3a8a;">${registro.placa}</td>
            <td>${registro.marca}</td>
            <td>${registro.ano}</td>
            <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12px;">${registro.tracao}</span></td>
            <td>${registro.proprietario}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoCaminhao(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarCaminhao(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirCaminhao(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaCaminhoesCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR CAMINHÃO
async function salvarCaminhao(e) {
    e.preventDefault();

    const id = document.getElementById('caminhao-id-oculto').value;
    const payload = {
        placa: document.getElementById('cam-placa').value.toUpperCase().trim(),
        chassi: document.getElementById('cam-chassi').value.trim(),
        marca: document.getElementById('cam-marca').value,
        ano: document.getElementById('cam-ano').value,
        tracao: document.getElementById('cam-tracao').value,
        proprietario: document.getElementById('cam-proprietario').value
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('caminhoes').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('caminhoes').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar caminhão:', resposta.error);
        alert('Erro ao processar dados do caminhão: ' + resposta.error.message);
    } else {
        alert(id ? 'Caminhão atualizado com sucesso!' : 'Caminhão cadastrado com sucesso!');
        limparFormularioCaminhao();
        buscarCaminhoesBanco();
    }
}

// 4. PESQUISAR / FILTRAR LOCALMENTE
function filtrarCaminhoes() {
    const termo = inputBuscaCaminhao.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaCaminhoes(listaCaminhoesLocal);
        return;
    }

    const filtrados = listaCaminhoesLocal.filter(reg => {
        return (reg.placa && reg.placa.toLowerCase().includes(termo)) ||
               (reg.marca && reg.marca.toLowerCase().includes(termo)) ||
               (reg.proprietario && reg.proprietario.toLowerCase().includes(termo)) ||
               (reg.chassi && reg.chassi.toLowerCase().includes(termo));
    });

    renderizarTabelaCaminhoes(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoCaminhao(id) {
    const cam = listaCaminhoesLocal.find(reg => reg.id === id);
    if (!cam) return;

    document.getElementById('caminhao-id-oculto').value = cam.id;
    document.getElementById('cam-placa').value = cam.placa;
    document.getElementById('cam-chassi').value = cam.chassi;
    document.getElementById('cam-marca').value = cam.marca;
    document.getElementById('cam-ano').value = cam.ano;
    document.getElementById('cam-tracao').value = cam.tracao;
    document.getElementById('cam-proprietario').value = cam.proprietario;

    document.getElementById('titulo-form-caminhao').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Veículo (Placa: ${cam.placa})`;
    document.getElementById('btn-salvar-caminhao').textContent = "Atualizar Veículo";
    document.getElementById('btn-cancelar-cam-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-caminhao').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR CAMINHÃO (Útil para frotas do mesmo proprietário/marca)
function duplicarCaminhao(id) {
    const cam = listaCaminhoesLocal.find(reg => reg.id === id);
    if (!cam) return;

    document.getElementById('caminhao-id-oculto').value = '';
    document.getElementById('cam-placa').value = ''; // Placa limpa porque cada um tem a sua
    document.getElementById('cam-chassi').value = '';
    document.getElementById('cam-marca').value = cam.marca;
    document.getElementById('cam-ano').value = cam.ano;
    document.getElementById('cam-tracao').value = cam.tracao;
    document.getElementById('cam-proprietario').value = cam.proprietario;

    document.getElementById('titulo-form-caminhao').innerHTML = `<i class="fa-solid fa-copy"></i> Duplicando Configuração (Insira a nova Placa/Chassi)`;
    document.getElementById('btn-salvar-caminhao').textContent = "Salvar Novo Veículo";
    document.getElementById('btn-cancelar-cam-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-caminhao').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR CAMINHÃO
async function excluirCaminhao(id) {
    const cam = listaCaminhoesLocal.find(reg => reg.id === id);
    if (!cam) return;

    if (!confirm(`Deseja mesmo remover o veículo de placa "${cam.placa}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('caminhoes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir veículo:', error);
        alert('Não foi possível deletar o veículo: ' + error.message);
    } else {
        alert('Veículo removido com sucesso!');
        buscarCaminhoesBanco();
    }
}

function limparFormularioCaminhao() {
    formCaminhao.reset();
    document.getElementById('caminhao-id-oculto').value = '';
    document.getElementById('titulo-form-caminhao').innerHTML = `<i class="fa-solid fa-truck"></i> Cadastrar Novo Caminhão`;
    document.getElementById('btn-salvar-caminhao').textContent = "Salvar Caminhão";
    document.getElementById('btn-cancelar-cam-edicao').style.display = "none";
}
