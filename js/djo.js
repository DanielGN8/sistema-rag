// ==========================================================================
// MÓDULO: DECLARAÇÃO JURAMENTADA DE ORIGEM (DJO)
// Arquivo: js/djo.js
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os escutadores e cargas assim que o DOM estiver pronto
    inicializarModuloDJO();
});

function inicializarModuloDJO() {
    // 1. Ouvintes do Modal de Busca de Itens
    const btnAbrirBusca = document.getElementById('btn-abrir-busca-item-djo');
    const btnFecharBuscaX = document.getElementById('btn-fechar-modal-item-djo');
    const btnCancelarBusca = document.getElementById('btn-cancelar-modal-item-djo');
    const inputPesquisa = document.getElementById('input-pesquisa-modal-djo');

    if (btnAbrirBusca) btnAbrirBusca.addEventListener('click', abrirModalBuscaItem);
    if (btnFecharBuscaX) btnFecharBuscaX.addEventListener('click', fecharModalBuscaItem);
    if (btnCancelarBusca) btnCancelarBusca.addEventListener('click', fecharModalBuscaItem);
    
    if (inputPesquisa) {
        // Busca em tempo real (Debounce simples para evitar requisições excessivas)
        let timeoutBusca = null;
        inputPesquisa.addEventListener('input', (e) => {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(() => {
                buscarItensNoSupabase(e.target.value.trim());
            }, 300);
        });
    }

    // 2. Carga Inicial de Dados
    carregarExportadoresDJO();

    // 3. Ouvinte do Formulário de Submissão
    const formDJO = document.getElementById('form-emitir-djo');
    if (formDJO) {
        formDJO.addEventListener('submit', processarEmissaoDJO);
    }
}

// ==========================================================================
// FUNCIONALIDADE 1: PESQUISA AVANÇADA DE ITENS (MODAL + SUPABASE)
// ==========================================================================

function abrirModalBuscaItem() {
    const modal = document.getElementById('modal-busca-item-djo');
    if (modal) {
        modal.classList.remove('hidden');
        // Limpa buscas anteriores ao abrir
        document.getElementById('input-pesquisa-modal-djo').value = '';
        document.getElementById('djo-modal-placeholder').classList.remove('hidden');
        document.getElementById('tabela-resultados-modal-djo').classList.add('hidden');
        document.getElementById('input-pesquisa-modal-djo').focus();
    }
}

function fecharModalBuscaItem() {
    const modal = document.getElementById('modal-busca-item-djo');
    if (modal) modal.classList.add('hidden');
}

/**
 * Realiza a consulta na tabela "itens" utilizando filtros lógicos (OR)
 */
async function buscarItensNoSupabase(termo) {
    const placeholder = document.getElementById('djo-modal-placeholder');
    const tabela = document.getElementById('tabela-resultados-modal-djo');
    const corpoTabela = document.getElementById('corpo-resultados-modal-djo');

    if (!termo || termo.length < 2) {
        placeholder.innerHTML = `<p style="font-size: 32px; margin-bottom: 10px;">📋</p>
                                 <p style="margin: 0; font-size: 14px;">Digite pelo menos 2 caracteres para pesquisar...</p>`;
        placeholder.classList.remove('hidden');
        tabela.classList.add('hidden');
        return;
    }

    try {
        // Busca com base nas colunas fornecidas na sua modelagem de banco
        const { data, error } = await supabaseClient
            .from('itens')
            .select('*')
            .or(`item.ilike.%${termo}%,ncm.ilike.%${termo}%,cod_fabricante.ilike.%${termo}%,fabricante.ilike.%${termo}%`)
            .limit(20);

        if (error) throw error;

        corpoTabela.innerHTML = '';

        if (!data || data.length === 0) {
            placeholder.innerHTML = `<p style="font-size: 32px; margin-bottom: 10px;">🔍</p>
                                     <p style="margin: 0; font-size: 14px; color: #b91c1c;">Nenhum item encontrado para "${termo}".</p>`;
            placeholder.classList.remove('hidden');
            tabela.classList.add('hidden');
            return;
        }

        // Alimenta as linhas da tabela de resultados
        data.forEach(registro => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            tr.style.cursor = 'pointer';
            
            // Efeito hover dinâmico por JS
            tr.onmouseenter = () => tr.style.backgroundColor = '#f1f5f9';
            tr.onmouseleave = () => tr.style.backgroundColor = 'transparent';

            tr.innerHTML = `
                <td style="padding: 12px; font-weight: 500; color: #1e293b;">${registro.item || ''}</td>
                <td style="padding: 12px; color: #475569;">${registro.ncm || ''}</td>
                <td style="padding: 12px; color: #475569;">${registro.fabricante || 'Não Informado'}</td>
                <td style="padding: 12px; text-align: center;">
                    <button type="button" class="btn-selecionar-item-modal" 
                            style="background-color: #0f766e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                        Selecionar
                    </button>
                </td>
            `;

            // Evento ao selecionar o item definitivo
            tr.querySelector('.btn-selecionar-item-modal').addEventListener('click', () => {
                vincularItemAoFormulario(registro);
            });

            corpoTabela.appendChild(tr);
        });

        placeholder.classList.add('hidden');
        tabela.classList.remove('hidden');

    } catch (err) {
        console.error('Erro na pesquisa de itens:', err);
        placeholder.innerHTML = `<p style="font-size: 32px; margin-bottom: 10px;">❌</p>
                                 <p style="margin: 0; font-size: 14px; color: #b91c1c;">Erro ao conectar com o banco de dados.</p>`;
    }
}

function vincularItemAoFormulario(itemObjeto) {
    // Alimenta os inputs visíveis e ocultos da página principal
    document.getElementById('djo-item-selecionado').value = itemObjeto.item || '';
    document.getElementById('djo-item-id').value = itemObjeto.id || '';
    document.getElementById('djo-item-ncm').value = itemObjeto.ncm || '';
    
    // Armazena o objeto completo temporariamente no dataset para uso no submit posterior
    document.getElementById('form-emitir-djo').dataset.itemCompleto = JSON.stringify(itemObjeto);

    fecharModalBuscaItem();
    alert('Sucesso: Item vinculado com sucesso à declaração!');
}


// ==========================================================================
// FUNCIONALIDADE 2: ALIMENTAR SELECT DE EXPORTADORES (SUPABASE)
// ==========================================================================

async function carregarExportadoresDJO() {
    const selectExportador = document.getElementById('djo-exportador');
    if (!selectExportador) return;

    try {
        // Busca os exportadores cadastrados ordenados por Razão Social / Nome
        const { data, error } = await supabaseClient
            .from('exportadores')
            .select('id, razao_social, cnpj') 
            .order('razao_social', { ascending: true });

        if (error) throw error;

        // Mantém a opção padrão e limpa os antigos
        selectExportador.innerHTML = '<option value="" disabled selected>Selecione um exportador...</option>';

        data.forEach(exp => {
            const opt = document.createElement('option');
            opt.value = exp.id;
            opt.textContent = `${exp.razao_social} (${exp.cnpj || 'Sem ID Fiscal'})`;
            selectExportador.appendChild(opt);
        });

    } catch (err) {
        console.error('Erro ao carregar exportadores:', err);
        selectExportador.innerHTML = '<option value="" disabled>Erro ao carregar registros do banco</option>';
    }
}


// ==========================================================================
// FUNCIONALIDADE 3: MAPEAMENTO DE CAMPOS E EMISSÃO DO DOCUMENTO (HTML / TEMPLATE)
// ==========================================================================

async function processarEmissaoDJO(e) {
    e.preventDefault();

    // Captura os elementos e os IDs selecionados
    const exportadorId = document.getElementById('djo-exportador').value;
    const itemId = document.getElementById('djo-item-id').value;

    if (!itemId) {
        alert('Erro: Você precisa pesquisar e selecionar um item na lupa antes de prosseguir.');
        return;
    }

    try {
        // Busca detalhada dos dados do Exportador completo diretamente no Supabase para preencher o documento
        const { data: exportadorCompleto, error: errExp } = await supabaseClient
            .from('exportadores')
            .select('*')
            .eq('id', exportadorId)
            .single();

        if (errExp) throw errExp;

        // Recupera os dados guardados do item selecionado
        const itemCompleto = JSON.parse(document.getElementById('form-emitir-djo').dataset.itemCompleto);

        // Captura das entradas manuais da página
        const numeroDoc = document.getElementById('djo-numero').value.trim();
        const dataDocInput = document.getElementById('djo-data').value; // YYYY-MM-DD
        const valorMinimo = parseFloat(document.getElementById('djo-valor-minimo').value).toFixed(2);
        const valorMaximo = parseFloat(document.getElementById('djo-valor-maximo').value).toFixed(2);
        const exportadorEhProdutor = document.getElementById('djo-exportador-produtor').checked;

        // Formatação simples de data para padrão BR/Mercosul (DD/MM/AAAA)
        let dataDocFormatada = dataDocInput;
        if (dataDocInput) {
            const [ano, mes, dia] = dataDocInput.split('-');
            dataDocFormatada = `${dia}/${mes}/${ano}`;
        }

        // ==================================================================
        // 🚨 CENTRAL DE MAPEAMENTO E SUBSTUIÇÃO DE CHAVES (EDITÁVEL AQUI)
        // Mapeie aqui: "Chave Exata no djo.html": "Valor capturado ou do banco"
        // ==================================================================
        const dicionarioSubstituicao = {
            "{{numeroDoc}}": numeroDoc,
            "{{dataDoc}}": dataDocFormatada,
            "{{valoresMinMax}}": `MINIMO: US$ ${valorMinimo} / MAXIMO: US$ ${valorMaximo}`,
            
            // Dados vindo da tabela 'exportadores' do Supabase
            "{{exportadorRazaoSocial}}": exportadorCompleto.razao_social || '',
            "{{exportadorEndereco}}": exportadorCompleto.endereco || '',
            "{{exportadorCidadeEstado}}": `${exportadorCompleto.cidade || ''} - ${exportadorCompleto.estado || ''}`,
            "{{exportadorPais}}": exportadorCompleto.pais || 'BRASIL',
            "{{exportadorTelefoneEmail}}": `${exportadorCompleto.telefone || ''} / ${exportadorCompleto.email || ''}`,
            "{{exportadorRepresentante}}": exportadorCompleto.representante_legal || 'REPRESENTANTE LEGAL',
            
            // Lógica dinâmica baseada no Checkbox "Exportador também é produtor?"
            "{{produtorRazaoSocial}}": exportadorEhProdutor ? exportadorCompleto.razao_social : (itemCompleto.fabricante || 'O MESMO'),
            "{{produtorEndereco}}": exportadorEhProdutor ? exportadorCompleto.endereco : 'CONFORME REGISTRO DO FABRICANTE',
            "{{produtorRepresentante}}": exportadorEhProdutor ? exportadorCompleto.representante_legal : 'GERENTE OPERACIONAL',

            // Dados vindo da tabela 'itens' do Supabase
            "{{itemNcm}}": itemCompleto.ncm || '',
            "{{itemNome}}": itemCompleto.item || '',
            "{{itemDescricaoDetalhada}}": `${itemCompleto.item || ''} - FABRICANTE: ${itemCompleto.fabricante || 'NÃO DEFINIDO'}. PROCESSO: ${itemCompleto.processo_produtivo || 'PADRÃO DE ORIGEM MERCOSUL.'}`,
            "{{itemCodFabricante}}": itemCompleto.cod_fabricante || 'N/A'
        };

        // Dispara a geração física do documento unificado
        gerarVisualizacaoDJO(dicionarioSubstituicao);

    } catch (err) {
        console.error('Erro ao gerar a DJO:', err);
        alert('Erro: Falha ao compilar dados para o documento. Verifique o console.');
    }
}

/**
 * Baixa o modelo bruto do djo.html, realiza as substituições e abre a janela de impressão
 */
async function gerarVisualizacaoDJO(mapaDeDados) {
    try {
        // Url base do seu template hospedado
        const urlTemplate = "https://danielgn8.github.io/sistema-rag/docs/djo.html";
        
        // Faz o download do esqueleto bruto do documento
        const resposta = await fetch(urlTemplate);
        if (!resposta.ok) throw new Error('Não foi possível obter o modelo base HTML.');
        
        let htmlFinal = await resposta.text();

        // Passa por cada chave do dicionário editável substituindo todas as ocorrências globais
        for (const [chave, valor] of Object.entries(mapaDeDados)) {
            // Cria uma expressão regular para substituir todas as chaves equivalentes encontradas
            const regex = new RegExp(chave.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            htmlFinal = htmlFinal.replace(regex, valor);
        }

        // Cria uma nova janela limpa no navegador para renderizar o documento montado
        const janelaImpressao = window.open('', '_blank', 'width=900,height=900');
        
        if (janelaImpressao) {
            janelaImpressao.document.open();
            janelaImpressao.document.write(htmlFinal);
            janelaImpressao.document.close();
            
            // Aguarda o carregamento leve dos estilos e dispara o print do sistema automaticamente
            janelaImpressao.onload = function() {
                janelaImpressao.print();
            };
        } else {
            alert('Aviso: Bloqueador de pop-ups ativo! Permita a abertura para visualizar o documento.');
        }

    } catch (erro) {
        console.error('Falha no motor de renderização HTML:', erro);
        alert('Erro ao processar template do arquivo base.');
    }
}
