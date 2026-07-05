// ==========================================
// VÍNCULO DE PESSOAS (DESPACHANTES) COM EMPRESAS
// Depende do supabaseClient e do alert() estilizado já criados no app.js
// ==========================================

let vinculoIdPessoaSelecionada = null;
let vinculoNomePessoaSelecionada = '';
let vinculoEmpresasAtuais = [];        // empresas já vinculadas à pessoa (vindas do banco)
let vinculoListaEmpresasCompleta = []; // cache com todas as empresas das 3 tabelas

// Cria a estrutura do modal (uma única vez) e injeta no final do <body>
function criarModalVinculos() {
    if (document.getElementById('modal-vinculos-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'modal-vinculos-overlay';
    overlay.className = 'modal-vinculos-overlay';
    overlay.innerHTML = `
        <div class="modal-vinculos-card">
            <button type="button" class="modal-vinculos-fechar" onclick="fecharModalVinculos()">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <!-- ETAPA 1: ESCOLHER A PESSOA -->
            <div id="vinculo-etapa-pessoas" class="vinculo-etapa">
                <h3><i class="fa-solid fa-user-tie"></i> Selecione a Pessoa</h3>
                <div class="modal-vinculos-busca">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="vinculo-busca-pessoa" placeholder="Pesquisar pessoa pelo nome..." oninput="filtrarListaVinculo('pessoa')">
                </div>
                <div id="vinculo-lista-pessoas" class="vinculo-lista"></div>
            </div>

            <!-- ETAPA 2: ESCOLHER AS EMPRESAS -->
            <div id="vinculo-etapa-empresas" class="vinculo-etapa" style="display:none;">
                <button type="button" class="btn-voltar-vinculo" onclick="voltarEtapaPessoas()">
                    <i class="fa-solid fa-arrow-left"></i> Trocar pessoa
                </button>
                <h3><i class="fa-solid fa-building"></i> Empresas vinculadas a <span id="vinculo-nome-pessoa-atual"></span></h3>
                <div class="modal-vinculos-busca">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="vinculo-busca-empresa" placeholder="Pesquisar empresa pelo nome..." oninput="filtrarListaVinculo('empresa')">
                </div>
                <div id="vinculo-lista-empresas" class="vinculo-lista"></div>
                <div class="modal-vinculos-footer">
                    <button type="button" class="btn-sistema btn-verde-agua" onclick="salvarVinculos()">
                        <i class="fa-solid fa-floppy-disk"></i> Salvar Vínculos
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Abre o modal (chamado pelo botão "Vincular Pessoas")
async function abrirModalVinculos() {
    criarModalVinculos();
    document.getElementById('modal-vinculos-overlay').classList.add('ativo');
    document.body.style.overflow = 'hidden'; // trava o scroll de fundo
    voltarEtapaPessoas();
    await carregarPessoasVinculo();
}

// Fecha e reseta o modal
function fecharModalVinculos() {
    const overlay = document.getElementById('modal-vinculos-overlay');
    if (!overlay) return;
    overlay.classList.remove('ativo');
    document.body.style.overflow = '';
    vinculoIdPessoaSelecionada = null;
    vinculoNomePessoaSelecionada = '';
    vinculoEmpresasAtuais = [];
}

// Volta da etapa de empresas para a etapa de escolha de pessoa
function voltarEtapaPessoas() {
    document.getElementById('vinculo-etapa-empresas').style.display = 'none';
    document.getElementById('vinculo-etapa-pessoas').style.display = 'block';
    const busca = document.getElementById('vinculo-busca-pessoa');
    if (busca) busca.value = '';
}

// Busca todas as pessoas (despachantes) cadastradas
async function carregarPessoasVinculo() {
    const lista = document.getElementById('vinculo-lista-pessoas');
    lista.innerHTML = '<p class="vinculo-carregando">Carregando pessoas...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('despachantes')
            .select('id, nome_despachante, rep_vinculos')
            .order('nome_despachante', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="vinculo-vazio">Nenhuma pessoa cadastrada ainda.</p>';
            return;
        }

        lista.innerHTML = '';
        data.forEach(pessoa => {
            const item = document.createElement('div');
            item.className = 'item-pessoa-vinculo';
            item.dataset.nome = (pessoa.nome_despachante || '').toLowerCase();
            item.innerHTML = `<i class="fa-solid fa-user"></i> ${pessoa.nome_despachante}`;
            item.addEventListener('click', () => selecionarPessoaVinculo(pessoa));
            lista.appendChild(item);
        });

    } catch (err) {
        console.error('Erro ao carregar pessoas:', err);
        lista.innerHTML = '<p class="vinculo-vazio">Erro ao carregar pessoas.</p>';
        alert('Erro ao buscar pessoas cadastradas.');
    }
}

// Quando uma pessoa é escolhida, avança para a etapa de empresas
async function selecionarPessoaVinculo(pessoa) {
    vinculoIdPessoaSelecionada = pessoa.id;
    vinculoNomePessoaSelecionada = pessoa.nome_despachante;

    // Transforma a string "Empresa A, Empresa B" em array ['Empresa A', 'Empresa B']
    vinculoEmpresasAtuais = (pessoa.rep_vinculos || '')
        .split(',')
        .map(nome => nome.trim())
        .filter(nome => nome.length > 0);

    document.getElementById('vinculo-nome-pessoa-atual').textContent = vinculoNomePessoaSelecionada;
    document.getElementById('vinculo-etapa-pessoas').style.display = 'none';
    document.getElementById('vinculo-etapa-empresas').style.display = 'block';

    await carregarEmpresasVinculo();
}

// Busca as empresas nas 3 tabelas (transportadores, exportadores, fabricantes)
async function carregarEmpresasVinculo() {
    const lista = document.getElementById('vinculo-lista-empresas');
    lista.innerHTML = '<p class="vinculo-carregando">Carregando empresas...</p>';

    try {
        const [transp, expo, fab] = await Promise.all([
            supabaseClient.from('transportadores').select('transportadora'),
            supabaseClient.from('exportadores').select('exportador'),
            supabaseClient.from('fabricantes').select('fabricante')
        ]);

        if (transp.error) throw transp.error;
        if (expo.error) throw expo.error;
        if (fab.error) throw fab.error;

        const empresas = [];
        (transp.data || []).forEach(r => { if (r.transportadora) empresas.push({ nome: r.transportadora, origem: 'Transportador' }); });
        (expo.data || []).forEach(r => { if (r.exportador) empresas.push({ nome: r.exportador, origem: 'Exportador' }); });
        (fab.data || []).forEach(r => { if (r.fabricante) empresas.push({ nome: r.fabricante, origem: 'Fabricante' }); });

        // Ordena por nome e remove duplicatas exatas (caso a mesma razão social exista em mais de uma tabela)
        const nomesVistos = new Set();
        vinculoListaEmpresasCompleta = empresas
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .filter(e => {
                const chave = e.nome.toLowerCase();
                if (nomesVistos.has(chave)) return false;
                nomesVistos.add(chave);
                return true;
            });

        renderizarListaEmpresas(vinculoListaEmpresasCompleta);

    } catch (err) {
        console.error('Erro ao carregar empresas:', err);
        lista.innerHTML = '<p class="vinculo-vazio">Erro ao carregar empresas.</p>';
        alert('Erro ao buscar empresas cadastradas.');
    }
}

// Desenha a lista de empresas com checkbox, já marcando as que estão vinculadas
function renderizarListaEmpresas(empresas) {
    const lista = document.getElementById('vinculo-lista-empresas');

    if (!empresas || empresas.length === 0) {
        lista.innerHTML = '<p class="vinculo-vazio">Nenhuma empresa encontrada.</p>';
        return;
    }

    lista.innerHTML = '';
    empresas.forEach(empresa => {
        const marcado = vinculoEmpresasAtuais.some(nome => nome.toLowerCase() === empresa.nome.toLowerCase());

        const item = document.createElement('label');
        item.className = 'item-empresa-vinculo';
        item.dataset.nome = empresa.nome.toLowerCase();
        item.innerHTML = `
            <input type="checkbox" value="${empresa.nome.replace(/"/g, '&quot;')}" ${marcado ? 'checked' : ''}>
            <span>${empresa.nome}</span>
            <small class="vinculo-origem-tag">${empresa.origem}</small>
        `;
        lista.appendChild(item);
    });
}

// Filtra a lista visível (pessoas ou empresas) conforme o texto digitado na busca
function filtrarListaVinculo(tipo) {
    if (tipo === 'pessoa') {
        const texto = document.getElementById('vinculo-busca-pessoa').value.toLowerCase();
        document.querySelectorAll('#vinculo-lista-pessoas .item-pessoa-vinculo').forEach(item => {
            item.style.display = item.dataset.nome.includes(texto) ? 'flex' : 'none';
        });
    } else {
        const texto = document.getElementById('vinculo-busca-empresa').value.toLowerCase();
        document.querySelectorAll('#vinculo-lista-empresas .item-empresa-vinculo').forEach(item => {
            item.style.display = item.dataset.nome.includes(texto) ? 'flex' : 'none';
        });
    }
}

// Salva os vínculos marcados na coluna rep_vinculos da pessoa selecionada
async function salvarVinculos() {
    if (!vinculoIdPessoaSelecionada) {
        alert('Nenhuma pessoa selecionada.');
        return;
    }

    const checkboxesMarcados = document.querySelectorAll('#vinculo-lista-empresas input[type="checkbox"]:checked');
    const empresasEscolhidas = Array.from(checkboxesMarcados).map(cb => cb.value);
    const valorFinal = empresasEscolhidas.join(', ');

    try {
        const { error } = await supabaseClient
            .from('despachantes')
            .update({ rep_vinculos: valorFinal })
            .eq('id', vinculoIdPessoaSelecionada);

        if (error) throw error;

        alert(`Vínculos de "${vinculoNomePessoaSelecionada}" salvos com sucesso!`);
        fecharModalVinculos();

        // Atualiza a tabela de despachantes na tela, se a função de listagem existir no seu sistema
        // Troque "carregarDespachantes" pelo nome real da sua função, se for diferente
        if (typeof carregarDespachantes === 'function') {
            carregarDespachantes();
        } else if (typeof listarDespachantes === 'function') {
            listarDespachantes();
        }

    } catch (err) {
        console.error('Erro ao salvar vínculos:', err);
        alert('Erro ao salvar os vínculos. Tente novamente.');
    }
}
