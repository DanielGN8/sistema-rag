let listaFrotasLocal = [];

const formFrota = document.getElementById('form-frota');
const tabelaFrotasCorpo = document.getElementById('tabela-frotas-corpo');
const inputBuscaFrota = document.getElementById('busca-frota');

document.addEventListener('DOMContentLoaded', () => {
    if (formFrota) formFrota.addEventListener('submit', salvarFrota);
});

const funcaoMostrarTelaCadastroOriginalParaFrota = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaFrota(idCadastro);
    if (idCadastro === 'cadastro-frotas') buscarFrotasBanco();
}

async function buscarFrotasBanco() {
    tabelaFrotasCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>`;
    const { data, error } = await supabaseClient.from('frotas').select('*').order('id', { ascending: false });
    if (error) { alert('Erro ao carregar frotas.'); return; }
    listaFrotasLocal = data;
    renderizarTabelaFrotas(listaFrotasLocal);
}

function renderizarTabelaFrotas(dados) {
    tabelaFrotasCorpo.innerHTML = '';
    if (dados.length === 0) {
        tabelaFrotasCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Nenhuma frota cadastrada.</td></tr>`;
        return;
    }
    dados.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${reg.frota}</td>
            <td>${reg.frota_doc}</td>
            <td>${reg.frota_endereco}</td>
            <td style="text-align: center;">
                <button class="btn-acao editar" onclick="prepararEdicaoFrota(${reg.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao duplicar" onclick="duplicarFrota(${reg.id})"><i class="fa-solid fa-copy"></i></button>
                <button class="btn-acao excluir" onclick="excluirFrota(${reg.id})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaFrotasCorpo.appendChild(tr);
    });
}

async function salvarFrota(e) {
    e.preventDefault();
    const id = document.getElementById('frota-id-oculto').value;
    const payload = {
        frota: document.getElementById('frota-nome').value.trim(),
        frota_doc: document.getElementById('frota-doc').value.trim(),
        frota_endereco: document.getElementById('frota-endereco').value.trim()
    };
    let res = id ? await supabaseClient.from('frotas').update([payload]).eq('id', id) : await supabaseClient.from('frotas').insert([payload]);
    if (res.error) { alert('Erro ao salvar: ' + res.error.message); } 
    else { alert('Salvo com sucesso!'); limparFormularioFrota(); buscarFrotasBanco(); }
}

function filtrarFrotas() {
    const termo = inputBuscaFrota.value.toLowerCase().trim();
    if (!termo) { renderizarTabelaFrotas(listaFrotasLocal); return; }
    const filtrados = listaFrotasLocal.filter(reg => 
        (reg.frota && reg.frota.toLowerCase().includes(termo)) || 
        (reg.frota_doc && reg.frota_doc.toLowerCase().includes(termo))
    );
    renderizarTabelaFrotas(filtrados);
}

function prepararEdicaoFrota(id) {
    const reg = listaFrotasLocal.find(r => r.id === id);
    if (!reg) return;
    document.getElementById('frota-id-oculto').value = reg.id;
    document.getElementById('frota-nome').value = reg.frota;
    document.getElementById('frota-doc').value = reg.frota_doc;
    document.getElementById('frota-endereco').value = reg.frota_endereco;
    document.getElementById('titulo-form-frota').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editando Frota`;
    document.getElementById('btn-salvar-frota').textContent = "Atualizar Frota";
    document.getElementById('btn-cancelar-frota-edicao').style.display = "inline-block";
}

function duplicarFrota(id) {
    const reg = listaFrotasLocal.find(r => r.id === id);
    if (!reg) return;
    document.getElementById('frota-id-oculto').value = '';
    document.getElementById('frota-nome').value = reg.frota + " (CÓPIA)";
    document.getElementById('frota-doc').value = reg.frota_doc;
    document.getElementById('frota-endereco').value = reg.frota_endereco;
    document.getElementById('btn-cancelar-frota-edicao').style.display = "inline-block";
}

async function excluirFrota(id) {
    if (!confirm('Deseja realmente excluir esta frota?')) return;
    const { error } = await supabaseClient.from('frotas').delete().eq('id', id);
    if (error) alert('Erro ao deletar.'); else buscarFrotasBanco();
}

function limparFormularioFrota() {
    formFrota.reset();
    document.getElementById('frota-id-oculto').value = '';
    document.getElementById('titulo-form-frota').innerHTML = `<i class="fa-solid fa-boxes-packing"></i> Cadastrar Nova Frota`;
    document.getElementById('btn-salvar-frota').textContent = "Salvar Frota";
    document.getElementById('btn-cancelar-frota-edicao').style.display = "none";
}
