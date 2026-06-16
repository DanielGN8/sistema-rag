// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO DE DESPACHANTES (SUPABASE)
// =======================================================

let listaDespachantesLocal = [];

const formDespachante = document.getElementById('form-despachante');
const tabelaDespachantesCorpo = document.getElementById('tabela-despachantes-corpo');
const inputBuscaDespachante = document.getElementById('busca-despachante');

document.addEventListener('DOMContentLoaded', () => {
    if (formDespachante) {
        formDespachante.addEventListener('submit', salvarDespachante);
    }
});

// Intercepta a abertura de telas para atualizar a lista sempre que o painel for aberto
const funcaoMostrarTelaCadastroOriginalParaDesp = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaDesp(idCadastro);
    if (idCadastro === 'cadastro-despachantes') {
        buscarDespachantesBanco();
    }
}

// 1. BUSCAR DESPACHANTES DO BANCO DE DADOS
async function buscarDespachantesBanco() {
    console.log("Buscando lista de despachantes no Supabase...");
    tabelaDespachantesCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando despachantes...</td></tr>`;

    const { data: despachantes, error } = await supabaseClient
        .from('despachantes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar despachantes:', error.message);
        alert('Erro ao carregar lista de despachantes.');
        return;
    }

    listaDespachantesLocal = despachantes;
    renderizarTabelaDespachantes(listaDespachantesLocal);
}

// 2. RENDERIZAR TABELA NA TELA
function renderizarTabelaDespachantes(dados) {
    tabelaDespachantesCorpo.innerHTML = '';

    if (dados.length === 0) {
        tabelaDespachantesCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Nenhum despachante cadastrado.</td></tr>`;
        return;
    }

    dados.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${registro.nome_despachante}</td>
            <td>${registro.documento}</td>
            <td><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:600;">${registro.registro}</span></td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoDespachante(${registro.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarDespachante(${registro.id})" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirDespachante(${registro.id})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaDespachantesCorpo.appendChild(tr);
    });
}

// 3. SALVAR OU ATUALIZAR DESPACHANTE
async function salvarDespachante(e) {
    e.preventDefault();

    const id = document.getElementById('despachante-id-oculto').value;
    const payload = {
        nome_despachante: document.getElementById('desp-nome').value.trim(),
        documento: document.getElementById('desp-documento').value.trim(),
        registro: document.getElementById('desp-registro').value.trim()
    };

    let resposta;

    if (id) {
        resposta = await supabaseClient.from('despachantes').update([payload]).eq('id', id).select();
    } else {
        resposta = await supabaseClient.from('despachantes').insert([payload]).select();
    }

    if (resposta.error) {
        console.error('Erro ao salvar despachante:', resposta.error);
        alert('Erro ao processar dados do despachante: ' + resposta.error.message);
    } else {
        alert(id ? 'Despachante atualizado com sucesso!' : 'Despachante cadastrado com sucesso!');
        limparFormularioDespachante();
        buscarDespachantesBanco();
    }
}

// 4. PESQUISAR / FILTRAR LOCALMENTE
function filtrarDespachantes() {
    const termo = inputBuscaDespachante.value.toLowerCase().trim();
    
    if (!termo) {
        renderizarTabelaDespachantes(listaDespachantesLocal);
        return;
    }

    const filtrados = listaDespachantesLocal.filter(reg => {
        return (reg.nome_despachante && reg.nome_despachante.toLowerCase().includes(termo)) ||
               (reg.documento && reg.documento.toLowerCase().includes(termo)) ||
               (reg.registro && reg.registro.toLowerCase().includes(termo));
    });

    renderizarTabelaDespachantes(filtrados);
}

// 5. CARREGAR DADOS PARA EDIÇÃO
function prepararEdicaoDespachante(id) {
    const desp = listaDespachantesLocal.find(reg => reg.id === id);
    if (!desp) return;

    document.getElementById('despachante-id-oculto').value = desp.id;
    document.getElementById('desp-nome').value = desp.nome_despachante;
    document.getElementById('desp-documento').value = desp.documento;
    document.getElementById('desp-registro').value = desp.registro;

    document.getElementById('titulo-form-despachante').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Despachante: ${desp.nome_despachante}`;
    document.getElementById('btn-salvar-despachante').textContent = "Atualizar Cadastro";
    document.getElementById('btn-cancelar-desp-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-despachante').scrollIntoView({ behavior: 'smooth' });
}

// 6. DUPLICAR DESPACHANTE (Útil para cadastrar profissionais da mesma empresa/filial)
function duplicarDespachante(id) {
    const desp = listaDespachantesLocal.find(reg => reg.id === id);
    if (!desp) return;

    document.getElementById('despachante-id-oculto').value = '';
    document.getElementById('desp-nome').value = desp.nome_despachante + " (CÓPIA)";
    document.getElementById('desp-documento').value = desp.documento;
    document.getElementById('desp-registro').value = ''; // Registro limpo por ser um dado estritamente individual

    document.getElementById('titulo-form-despachante').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia do Despachante`;
    document.getElementById('btn-salvar-despachante').textContent = "Salvar Cópia";
    document.getElementById('btn-cancelar-desp-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-despachante').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR DESPACHANTE
async function excluirDespachante(id) {
    const desp = listaDespachantesLocal.find(reg => reg.id === id);
    if (!desp) return;

    if (!confirm(`Deseja mesmo remover o despachante "${desp.nome_despachante}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('despachantes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir despachante:', error);
        alert('Não foi possível deletar o despachante: ' + error.message);
    } else {
        alert('Despachante removido com sucesso!');
        buscarDespachantesBanco();
    }
}

function limparFormularioDespachante() {
    formDespachante.reset();
    document.getElementById('despachante-id-oculto').value = '';
    document.getElementById('titulo-form-despachante').innerHTML = `<i class="fa-solid fa-user-tie"></i> Cadastrar Novo Despachante`;
    document.getElementById('btn-salvar-despachante').textContent = "Salvar Despachante";
    document.getElementById('btn-cancelar-desp-edicao').style.display = "none";
}
