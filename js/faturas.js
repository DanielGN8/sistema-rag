// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO E EMISSÃO DE FATURAS
// =======================================================

// Variáveis de controle local
let itensFaturaSelecionadosLocal = []; // Armazena temporariamente os itens adicionados na fatura atual
let listaItensBanco = [];             // Cache dos itens cadastrados no banco para a busca rápida
let itemFaturaAtualInstancia = null;  // Guarda o objeto do item selecionado na busca no momento

// Intercepta a função mostrarTela nativa para preparar o estado da página
const funcaoMostrarTelaOriginalParaFaturas = mostrarTela;
mostrarTela = function(idTela) {
    funcaoMostrarTelaOriginalParaFaturas(idTela);
    
    if (idTela === 'painel-faturas') {
        prepararNovaFaturaInicial();
    }
}

// 1. PREPARAR O ESTADO INICIAL DE UMA NOVA FATURA
async function prepararNovaFaturaInicial() {
    abrirFormularioNovaFatura();
    itensFaturaSelecionadosLocal = [];
    itemFaturaAtualInstancia = null;
    renderizarTabelaItensIncluidos();
    
    // Automação: Define a Data de Emissão Atual no formato legível (DD/MM/AAAA)
    const hoje = new Date();
    document.getElementById('fat-emissao').value = hoje.toLocaleDateString('pt-BR');
    
    // Automação: Gera um número sequencial temporário ou timestamp exclusivo (Ex: FAT-20260617-1420)
    // Dica: Futuramente, você pode buscar o último ID + 1 do banco de dados
    const timestamp = hoje.getFullYear().toString() + 
                      (hoje.getMonth()+1).toString().padStart(2, '0') + 
                      hoje.getDate().toString().padStart(2, '0') + "-" + 
                      hoje.getHours().toString().padStart(2, '0') + 
                      hoje.getMinutes().toString().padStart(2, '0');
    document.getElementById('fat-numero').value = `FAT-${timestamp}`;

    // Carrega os selects dinâmicos do banco de dados
    await carregarExportadoresSelect();
    await carregarImportadoresSelect();
    await carregarCacheItensBanco();
}

// 2. CARREGAR SELECTS COM DADOS DO SUPABASE
async function carregarExportadoresSelect() {
    const selectExp = document.getElementById('fat-exportador');
    selectExp.innerHTML = '<option value="" disabled selected>Carregando exportadores...</option>';
    
    const { data: exportadores, error } = await supabaseClient.from('exportadores').select('id, exportador').order('exportador', { ascending: true });
    
    if (error) { console.error(error); return; }
    
    selectExp.innerHTML = '<option value="" disabled selected>Selecione o Exportador...</option>';
    exportadores.forEach(exp => {
        selectExp.innerHTML += `<option value="${exp.id}">${exp.exportador}</option>`;
    });
}

async function carregarImportadoresSelect() {
    const selectImp = document.getElementById('fat-importador');
    selectImp.innerHTML = '<option value="" disabled selected>Carregando importadores...</option>';
    
    const { data: importadores, error } = await supabaseClient.from('importadores').select('id, importador').order('importador', { ascending: true });
    
    if (error) { console.error(error); return; }
    
    selectImp.innerHTML = '<option value="" disabled selected>Selecione o Importador...</option>';
    importadores.forEach(imp => {
        selectImp.innerHTML += `<option value="${imp.id}">${imp.importador}</option>`;
    });
}

async function carregarCacheItensBanco() {
    // Busca os itens uma única vez ao abrir a tela para deixar a busca instantânea por digitação
    const { data: itens, error } = await supabaseClient.from('itens').select('*');
    if (!error) {
        listaItensBanco = itens;
    }
}

// 3. SISTEMA DE BUSCA INTELIGENTE DE ITENS (Nome, Código ou NCM)
function pesquisarItemFaturaInput() {
    const termo = document.getElementById('busca-item-fatura').value.toLowerCase().trim();
    const containerSugestoes = document.getElementById('sugestoes-itens-fatura');
    
    if (!termo || listaItensBanco.length === 0) {
        containerSugestoes.style.display = 'none';
        return;
    }

    // Filtra no cache por qualquer uma das 3 propriedades definidas por você
    const filtrados = listaItensBanco.filter(item => {
        return (item.item && item.item.toLowerCase().includes(termo)) ||
               (item.ncm && item.ncm.toLowerCase().includes(termo)) ||
               (item.codigo_fabricante && item.codigo_fabricante.toLowerCase().includes(termo));
    });

    if (filtrados.length === 0) {
        containerSugestoes.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:13px;">Nenhum item localizado</div>';
        containerSugestoes.style.display = 'block';
        return;
    }

    containerSugestoes.innerHTML = '';
    filtrados.slice(0, 5).forEach(item => { // Limita a 5 sugestões na tela para não estourar o layout
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #f1f5f9';
        div.style.fontSize = '13px';
        div.innerHTML = `<b>${item.item}</b> <br> <span style="color:#64748b; font-size:11px;">NCM: ${item.ncm} | Cód: ${item.codigo_fabricante || 'N/A'}</span>`;
        
        div.onclick = () => selecionarItemParaFatura(item);
        containerSugestoes.appendChild(div);
    });
    
    containerSugestoes.style.display = 'block';
}

function selecionarItemParaFatura(item) {
    itemFaturaAtualInstancia = item;
    document.getElementById('busca-item-fatura').value = item.item;
    document.getElementById('add-item-ncm').value = item.ncm; // Trava o NCM no campo desabilitado
    document.getElementById('sugestoes-itens-fatura').style.display = 'none';
    
    // Foca no campo de quantidade para agilizar a digitação do usuário
    document.getElementById('add-item-qtd').focus();
}

// 4. CÁLCULO DE PREVIEW E INCLUSÃO DE ITENS NA LISTA LOCAL
function calcularTotalItemRapido() {
    const qtd = parseFloat(document.getElementById('add-item-qtd').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('add-item-valor').value) || 0;
    const subtotal = qtd * valorUnitario;
    
    document.getElementById('preview-total-item').innerHTML = `Total deste item: <b>$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>`;
}

function adicionarItemFaturaTabela() {
    if (!itemFaturaAtualInstancia) {
        alert('Por favor, pesquise e selecione um item válido primeiro.');
        return;
    }
    
    const qtd = parseFloat(document.getElementById('add-item-qtd').value);
    const valorUnitario = parseFloat(document.getElementById('add-item-valor').value);
    
    if (!qtd || qtd <= 0 || !valorUnitario || valorUnitario <= 0) {
        alert('Insira uma quantidade e um valor unitário válidos e maiores que zero.');
        return;
    }

    // Adiciona o item estruturado na memória local
    itensFaturaSelecionadosLocal.push({
        id_item: itemFaturaAtualInstancia.id,
        nome: itemFaturaAtualInstancia.item,
        ncm: itemFaturaAtualInstancia.ncm,
        quantidade: qtd,
        valor_unitario: valorUnitario,
        subtotal: qtd * valorUnitario
    });

    // Limpa a área de inserção de itens para o próximo produto
    itemFaturaAtualInstancia = null;
    document.getElementById('busca-item-fatura').value = '';
    document.getElementById('add-item-ncm').value = '';
    document.getElementById('add-item-qtd').value = '';
    document.getElementById('add-item-valor').value = '';
    document.getElementById('preview-total-item').innerHTML = 'Total deste item: <b>$ 0,00</b>';

    renderizarTabelaItensIncluidos();
}

function removerItemFaturaLocal(index) {
    itensFaturaSelecionadosLocal.splice(index, 1);
    renderizarTabelaItensIncluidos();
}

// 5. RENDERIZAÇÃO DA TABELA DE ITENS DA FATURA ATUAL E SOMA DO TOTAL
function renderizarTabelaItensIncluidos() {
    const tabelaCorpo = document.getElementById('tabela-itens-fatura-incluidos');
    tabelaCorpo.innerHTML = '';
    
    if (itensFaturaSelecionadosLocal.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum produto inserido nesta fatura ainda.</td></tr>`;
        document.getElementById('fat-valor-total-exibicao').textContent = '$ 0,00';
        return;
    }

    let valorTotalFatura = 0;

    itensFaturaSelecionadosLocal.forEach((item, index) => {
        valorTotalFatura += item.subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${item.nome}</b></td>
            <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12px;">${item.ncm}</span></td>
            <td style="text-align: center;">${item.quantidade}</td>
            <td style="text-align: right;">$ ${item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-weight: 600; color:#1e293b;">$ ${item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: center;">
                <button type="button" class="btn-acao excluir" onclick="removerItemFaturaLocal(${index})" style="padding:4px 8px; font-size:12px;"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tabelaCorpo.appendChild(tr);
    });

    // Atualiza o painel inferior com o somatório de todos os produtos
    document.getElementById('fat-valor-total-exibicao').textContent = `$ ${valorTotalFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 6. NAVEGAÇÃO ENTRE ABAS INTERNAS
function abrirFormularioNovaFatura() {
    document.getElementById('sub-bloco-lista-faturas').style.display = 'none';
    document.getElementById('sub-bloco-form-fatura').style.display = 'block';
    document.getElementById('btn-aba-nova').style.opacity = '1';
    document.getElementById('btn-aba-lista').style.opacity = '0.6';
    document.getElementById('titulo-form-fatura').innerHTML = `<i class="fa-solid fa-circle-plus"></i> Nova Fatura Comercial`;
}

function visualizarListaFaturas() {
    document.getElementById('sub-bloco-form-fatura').style.display = 'none';
    document.getElementById('sub-bloco-lista-faturas').style.display = 'block';
    document.getElementById('btn-aba-nova').style.opacity = '0.6';
    document.getElementById('btn-aba-lista').style.opacity = '1';
}

function resetarAbasFatura() {
    document.getElementById('form-fatura').reset();
    document.getElementById('fatura-id-oculto').value = '';
    prepararNovaFaturaInicial();
}

// =======================================================
// 7. GRAVAÇÃO DA FATURA E DOS ITENS NO SUPABASE
// =======================================================

// Escuta o envio do formulário de fatura
document.getElementById('form-fatura').addEventListener('submit', salvarFaturaCompletaBanco);

async function salvarFaturaCompletaBanco(e) {
    e.preventDefault(); // Impede o recarregamento da página

    // Validação crucial: Não faz sentido salvar uma fatura sem produtos
    if (itensFaturaSelecionadosLocal.length === 0) {
        alert('Atenção: Insira pelo menos um item/produto na lista antes de salvar a fatura.');
        return;
    }

    // Pega o ID oculto caso seja uma edição (futura)
    const idFaturaExistente = document.getElementById('fatura-id-oculto').value;

    // 1. Calcula o valor total limpo (sem formatação de texto) para guardar no banco
    let valorTotalNumerico = 0;
    itensFaturaSelecionadosLocal.forEach(item => valorTotalNumerico += item.subtotal);

    // 2. Monta o payload com os dados gerais (Cabeçalho da Fatura)
    const payloadFatura = {
        numero_fatura: document.getElementById('fat-numero').value,
        data_emissao: document.getElementById('fat-emissao').value,
        data_exportacao: document.getElementById('fat-data-exportacao').value,
        moeda: document.getElementById('fat-moeda').value,
        id_exportador: parseInt(document.getElementById('fat-exportador').value),
        id_importador: parseInt(document.getElementById('fat-importador').value),
        peso_bruto: parseFloat(document.getElementById('fat-peso-bruto').value),
        peso_liquido: parseFloat(document.getElementById('fat-peso-liquido').value),
        volume_qtd: parseFloat(document.getElementById('fat-volume-qtd').value),
        volume_unidade: document.getElementById('fat-volume-unidade').value,
        valor_total: valorTotalNumerico
    };

    try {
        let idFaturaGerado = idFaturaExistente;

        if (idFaturaExistente) {
            // [CENÁRIO A] - Atualização de Fatura Existente
            const { error: errorUpdate } = await supabaseClient
                .from('faturas')
                .update([payloadFatura])
                .eq('id', idFaturaExistente);

            if (errorUpdate) throw errorUpdate;

            // Para atualizar os itens, a forma mais limpa e segura é apagar os antigos deste ID e reinserir
            const { error: errorDeleteItens } = await supabaseClient
                .from('fatura_itens')
                .delete()
                .eq('id_fatura', idFaturaExistente);

            if (errorDeleteItens) throw errorDeleteItens;

        } else {
            // [CENÁRIO B] - Nova Fatura (Retorna o ID gerado pelo banco através do .select())
            const { data: dadosNovos, error: errorInsert } = await supabaseClient
                .from('faturas')
                .insert([payloadFatura])
                .select('id')
                .single();

            if (errorInsert) throw errorInsert;
            idFaturaGerado = dadosNovos.id; // Captura o ID gerado pelo auto-incremento
        }

        // 3. Preparar o lote de produtos vinculando-os ao idFaturaGerado
        const payloadItens = itensFaturaSelecionadosLocal.map(item => {
            return {
                id_fatura: idFaturaGerado, // O vínculo/Chave Estrangeira
                id_item: item.id_item,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                subtotal: item.subtotal
            };
        });

        // 4. Inserção em lote (Bulk Insert) na tabela fatura_itens
        const { error: errorItens } = await supabaseClient
            .from('fatura_itens')
            .insert(payloadItens);

        if (errorItens) throw errorItens;

        // Sucesso absoluto nas duas tabelas!
        alert('Fatura Comercial gravada com sucesso no Supabase!');
        
        // Limpa tudo e reinicia a tela com um novo número e estado limpo
        resetarAbasFatura();

    } catch (err) {
        console.error('Erro na transação de salvamento:', err);
        alert('Erro ao salvar no banco de dados: ' + (err.message || err));
    }
}
