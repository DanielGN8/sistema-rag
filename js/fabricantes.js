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

// 1. BUSCAR FABRICANTES DO BANCO DE DADOS
async function buscarFabricantesBanco() {
    console.log("Buscando lista de fabricantes no Supabase...");
    if (!tabelaFabricantesCorpo) return;
    
    tabelaFabricantesCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando fabricantes...</td></tr>`;

    const { data: fabricantes, error } = await supabaseClient
        .from('fabricantes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar fabricantes:', error);
        tabelaFabricantesCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#b91c1c;"><i class="fa-solid fa-circle-exclamation"></i> Erro ao carregar dados do banco.</td></tr>`;
        return;
    }

    listaFabricantesLocal = fabricantes || [];
    renderizarTabelaFabricantes(listaFabricantesLocal);
}

// 2. RENDERIZAR TABELA DE FABRICANTES
function renderizarTabelaFabricantes(lista) {
    if (!tabelaFabricantesCorpo) return;

    if (lista.length === 0) {
        tabelaFabricantesCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 20px;">Nenhum fabricante encontrado.</td></tr>`;
        return;
    }

    tabelaFabricantesCorpo.innerHTML = '';

    lista.forEach(reg => {
        const tr = document.createElement('tr');
        
        // Formata a localização (Cidade - Estado)
        const localizacao = [reg.cidade, reg.estado].filter(Boolean).join(' - ') || 'Não informado';

        tr.innerHTML = `
            <td style="font-weight: 600; color: #1e293b;">${reg.fabricante || 'Sem Nome'}</td>
            <td style="color: #475569;">${reg.cnpj || 'Não cadastrado'}</td>
            <td style="color: #475569;">${localizacao}</td>
            <td style="color: #475569;">${reg.pais || 'Brasil'}</td>
            <td>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-acao btn-acao-azul" onclick="editarFabricante(${reg.id})" title="Editar Fabricante">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-acao btn-acao-laranja" onclick="duplicarFabricante(${reg.id})" title="Duplicar / Salvar Cópia">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <button class="btn-acao btn-acao-vermelho" onclick="excluirFabricante(${reg.id})" title="Excluir Fabricante">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tabelaFabricantesCorpo.appendChild(tr);
    });
}

// 3. FILTRAR FABRICANTES (BUSCA EM TEMPO REAL)
function filtrarFabricantesLocal() {
    const termo = inputBuscaFabricante.value.toLowerCase().trim();
    if (!termo) {
        renderizarTabelaFabricantes(listaFabricantesLocal);
        return;
    }

    const filtrados = listaFabricantesLocal.filter(reg => {
        const nome = (reg.fabricante || '').toLowerCase();
        const cnpj = (reg.cnpj || '').toLowerCase();
        const cidade = (reg.cidade || '').toLowerCase();
        return nome.includes(termo) || cnpj.includes(termo) || cidade.includes(termo);
    });

    renderizarTabelaFabricantes(filtrados);
}

// 4. SALVAR / ATUALIZAR FABRICANTE
async function salvarFabricante(e) {
    e.preventDefault();

    const idOculto = document.getElementById('fabricante-id-oculto').value;
    const nome = document.getElementById('fabricante-nome').value.trim();
    const cnpj = document.getElementById('fabricante-cnpj').value.trim();
    const endereco = document.getElementById('fabricante-endereco').value.trim();
    const cidade = document.getElementById('fabricante-cidade').value.trim();
    const estado = document.getElementById('fabricante-estado').value.trim();
    const pais = document.getElementById('fabricante-pais').value.trim();

    if (!nome) {
        alert('O nome do fabricante é obrigatório.');
        return;
    }

    // Monta o objeto com as colunas exatas do banco do Supabase
    const payload = {
        fabricante: nome,
        cnpj: cnpj,
        endereco: endereco,
        cidade: cidade,
        estado: estado,
        pais: pais
    };

    let erroBanco = null;

    if (idOculto) {
        // Modo de Edição
        const { error } = await supabaseClient
            .from('fabricantes')
            .update(payload)
            .eq('id', idOculto);
        erroBanco = error;
    } else {
        // Modo de Inserção de Novo Registro
        const { error } = await supabaseClient
            .from('fabricantes')
            .insert([payload]);
        erroBanco = error;
    }

    if (erroBanco) {
        console.error('Erro ao salvar fabricante:', erroBanco);
        alert('Erro ao salvar dados do fabricante: ' + erroBanco.message);
    } else {
        alert(idOculto ? 'Fabricante atualizado com sucesso!' : 'Fabricante cadastrado com sucesso!');
        limparFormularioFabricante();
        buscarFabricantesBanco();
    }
}

// 5. PREPARAR EDIÇÃO
function editarFabricante(id) {
    const reg = listaFabricantesLocal.find(item => item.id === id);
    if (!reg) return;

    document.getElementById('fabricante-id-oculto').value = reg.id;
    document.getElementById('fabricante-nome').value = reg.fabricante || '';
    document.getElementById('fabricante-cnpj').value = reg.cnpj || '';
    document.getElementById('fabricante-endereco').value = reg.endereco || '';
    document.getElementById('fabricante-cidade').value = reg.cidade || '';
    document.getElementById('fabricante-estado').value = reg.estado || '';
    document.getElementById('fabricante-pais').value = reg.pais || 'Brasil';

    document.getElementById('titulo-form-fabricante').innerHTML = `<i class="fa-solid fa-pen"></i> Editando Fabricante: ${reg.fabricante}`;
    document.getElementById('btn-salvar-fabricante').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Atualizar Fabricante`;
    document.getElementById('btn-cancelar-fab-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-fabricante').scrollIntoView({ behavior: 'smooth' });
}

// 6. PREPARAR DUPLICAÇÃO (SALVAR CÓPIA)
function duplicarFabricante(id) {
    const reg = listaFabricantesLocal.find(item => item.id === id);
    if (!reg) return;

    // Limpa o ID oculto para criar um registro totalmente novo no banco
    document.getElementById('fabricante-id-oculto').value = '';
    
    document.getElementById('fabricante-nome').value = (reg.fabricante || '') + ' (Cópia)';
    document.getElementById('fabricante-cnpj').value = reg.cnpj || '';
    document.getElementById('fabricante-endereco').value = reg.endereco || '';
    document.getElementById('fabricante-cidade').value = reg.cidade || '';
    document.getElementById('fabricante-estado').value = reg.estado || '';
    document.getElementById('fabricante-pais').value = reg.pais || 'Brasil';

    document.getElementById('titulo-form-fabricante').innerHTML = `<i class="fa-solid fa-copy"></i> Salvando Cópia do Fabricante`;
    document.getElementById('btn-salvar-fabricante').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Cópia`;
    document.getElementById('btn-cancelar-fab-edicao').style.display = "inline-block";
    
    document.getElementById('titulo-form-fabricante').scrollIntoView({ behavior: 'smooth' });
}

// 7. EXCLUIR FABRICANTE
async function excluirFabricante(id) {
    const reg = listaFabricantesLocal.find(item => item.id === id);
    if (!reg) return;

    if (!confirm(`Tem certeza de que deseja excluir o fabricante "${reg.fabricante}"?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from('fabricantes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir fabricante:', error);
        alert('Não foi possível deletar o fabricante: ' + error.message);
    } else {
        alert('Fabricante removido com sucesso.');
        buscarFabricantesBanco();
    }
}

// 8. LIMPAR FORMULÁRIO
function limparFormularioFabricante() {
    if (formFabricante) formFabricante.reset();
    document.getElementById('fabricante-id-oculto').value = '';
    document.getElementById('titulo-form-fabricante').innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> Cadastrar Novo Fabricante`;
    document.getElementById('btn-salvar-fabricante').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Fabricante`;
    document.getElementById('btn-cancelar-fab-edicao').style.display = "none";
}
