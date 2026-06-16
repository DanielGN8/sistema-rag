let listaProprietariosLocal = [];

const formProprietario = document.getElementById('form-proprietario');
const tabelaProprietariosCorpo = document.getElementById('tabela-proprietarios-corpo');
const inputBuscaProprietario = document.getElementById('busca-proprietario');

document.addEventListener('DOMContentLoaded', () => {
    if (formProprietario) formProprietario.addEventListener('submit', salvarProprietario);
});

const funcaoMostrarTelaCadastroOriginalParaProp = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaProp(idCadastro);
    if (idCadastro === 'cadastro-proprietarios') buscarProprietariosBanco();
}

async function buscarProprietariosBanco() {
    tabelaProprietariosCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>`;
    const { data, error } = await supabaseClient.from('proprietarios').select('*').order('id', { ascending: false });
    if (error) { alert('Erro ao carregar proprietários.'); return; }
    listaProprietariosLocal = data;
    renderizarTabelaProprietarios(listaProprietariosLocal);
}

function renderizarTabelaProprietarios(dados) {
    tabelaProprietariosCorpo.innerHTML = '';
    if (dados.length === 0) {
        tabelaProprietariosCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Nenhum proprietário cadastrado.</td></tr>`;
        return;
    }
    dados.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${reg.proprietario}</td>
            <td>${reg.prop_doc}</td>
            <td>${reg.prop_endereco}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoProprietario(${reg.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarProprietario(${reg.id})"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirProprietario(${reg.id})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaProprietariosCorpo.appendChild(tr);
    });
}

async function salvarProprietario(e) {
    e.preventDefault();
    const id = document.getElementById('proprietario-id-oculto').value;
    const payload = {
        proprietario: document.getElementById('prop-nome').value.trim(),
        prop_doc: document.getElementById('prop-doc').value.trim(),
        prop_endereco: document.getElementById('prop-endereco').value.trim()
    };
    let res = id ? await supabaseClient.from('proprietarios').update([payload]).eq('id', id) : await supabaseClient.from('proprietarios').insert([payload]);
    if (res.error) { alert('Erro ao salvar: ' + res.error.message); } 
    else { alert('Salvo com sucesso!'); limparFormularioProprietario(); buscarProprietariosBanco(); }
}

function filtrarProprietarios() {
    const termo = inputBuscaProprietario.value.toLowerCase().trim();
    if (!termo) { renderizarTabelaProprietarios(listaProprietariosLocal); return; }
    const filtrados = listaProprietariosLocal.filter(reg => 
        (reg.proprietario && reg.proprietario.toLowerCase().includes(termo)) || 
        (reg.prop_doc && reg.prop_doc.toLowerCase().includes(termo))
    );
    renderizarTabelaProprietarios(filtrados);
}

function prepararEdicaoProprietario(id) {
    const reg = listaProprietariosLocal.find(r => r.id === id);
    if (!reg) return;
    document.getElementById('proprietario-id-oculto').value = reg.id;
    document.getElementById('prop-nome').value = reg.proprietario;
    document.getElementById('prop-doc').value = reg.prop_doc;
    document.getElementById('prop-endereco').value = reg.prop_endereco;
    document.getElementById('titulo-form-proprietario').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Proprietário`;
    document.getElementById('btn-salvar-proprietario').textContent = "Atualizar Proprietário";
    document.getElementById('btn-cancelar-prop-edicao').style.display = "inline-block";
}

function duplicarProprietario(id) {
    const reg = listaProprietariosLocal.find(r => r.id === id);
    if (!reg) return;
    document.getElementById('proprietario-id-oculto').value = '';
    document.getElementById('prop-nome').value = reg.proprietario + " (CÓPIA)";
    document.getElementById('prop-doc').value = reg.prop_doc;
    document.getElementById('prop-endereco').value = reg.prop_endereco;
    document.getElementById('btn-cancelar-prop-edicao').style.display = "inline-block";
}

async function excluirProprietario(id) {
    if (!confirm('Deseja realmente excluir este proprietário?')) return;
    const { error } = await supabaseClient.from('proprietarios').delete().eq('id', id);
    if (error) alert('Erro ao deletar.'); else buscarProprietariosBanco();
}

function limparFormularioProprietario() {
    formProprietario.reset();
    document.getElementById('proprietario-id-oculto').value = '';
    document.getElementById('titulo-form-proprietario').innerHTML = `<i class="fa-solid fa-id-card-clip"></i> Cadastrar Novo Proprietário`;
    document.getElementById('btn-salvar-proprietario').textContent = "Salvar Proprietário";
    document.getElementById('btn-cancelar-prop-edicao').style.display = "none";
}
