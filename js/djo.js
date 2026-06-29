// ==========================================
// MÓDULO: DJO - DECLARAÇÃO JURAMENTADA DE ORIGEM
// ==========================================

// ==========================================
// MODAL DE BUSCA DE ITEM
// ==========================================

let itensBuscados = []; // Cache dos resultados de busca

// Abre o modal de busca de item
function abrirModalBuscaItem() {
    // Cria o overlay + modal se ainda não existir
    if (!document.getElementById('modal-busca-item')) {
        criarModalBuscaItem();
    }

    const modal = document.getElementById('modal-busca-item');
    modal.style.display = 'flex';

    // Pequena pausa para acionar a animação de entrada
    setTimeout(() => {
        modal.classList.add('ativo');
    }, 10);

    // Limpa estado anterior
    document.getElementById('modal-busca-input').value = '';
    document.getElementById('modal-busca-resultados').innerHTML = `
        <div class="modal-busca-placeholder">
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>Digite ao menos 2 caracteres para pesquisar</p>
        </div>`;
    
    // Foca no campo de busca automaticamente
    setTimeout(() => {
        document.getElementById('modal-busca-input').focus();
    }, 150);
}

// Fecha o modal de busca de item
function fecharModalBuscaItem() {
    const modal = document.getElementById('modal-busca-item');
    if (!modal) return;
    modal.classList.remove('ativo');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 250);
}

// Cria a estrutura HTML do modal dinamicamente e injeta no body
function criarModalBuscaItem() {
    const modal = document.createElement('div');
    modal.id = 'modal-busca-item';
    modal.className = 'modal-busca-overlay';

    modal.innerHTML = `
        <div class="modal-busca-card">

            <div class="modal-busca-header">
                <div>
                    <h3><i class="fa-solid fa-boxes-stacked"></i> Buscar Item / Produto</h3>
                    <p>Pesquise pelo nome, NCM, código ou fabricante</p>
                </div>
                <button class="modal-busca-fechar" id="btn-fechar-modal-busca" title="Fechar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="modal-busca-corpo">
                <div class="modal-busca-campo-wrapper">
                    <i class="fa-solid fa-magnifying-glass modal-busca-icone-input"></i>
                    <input
                        type="text"
                        id="modal-busca-input"
                        class="modal-busca-input"
                        placeholder="Ex: parafuso, 7318.15, BR-001, Brasmetal..."
                        autocomplete="off"
                    />
                    <span id="modal-busca-spinner" class="modal-busca-spinner" style="display:none;">
                        <i class="fa-solid fa-circle-notch fa-spin"></i>
                    </span>
                </div>

                <div class="modal-busca-filtros">
                    <span class="modal-busca-filtro-label">Filtrar por:</span>
                    <label class="modal-busca-chip">
                        <input type="checkbox" value="item" checked> Nome
                    </label>
                    <label class="modal-busca-chip">
                        <input type="checkbox" value="ncm" checked> NCM
                    </label>
                    <label class="modal-busca-chip">
                        <input type="checkbox" value="codigo_fabricante" checked> Cód. Fabricante
                    </label>
                    <label class="modal-busca-chip">
                        <input type="checkbox" value="fabricante" checked> Fabricante
                    </label>
                </div>

                <div id="modal-busca-resultados" class="modal-busca-resultados">
                    <div class="modal-busca-placeholder">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <p>Digite ao menos 2 caracteres para pesquisar</p>
                    </div>
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(modal);

    // ---- Event Listeners ----

    // Fechar ao clicar no X
    modal.querySelector('#btn-fechar-modal-busca').addEventListener('click', fecharModalBuscaItem);

    // Fechar ao clicar no fundo escurecido
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalBuscaItem();
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModalBuscaItem();
    });

    // Busca com debounce ao digitar
    let debounceTimer;
    modal.querySelector('#modal-busca-input').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const termo = e.target.value.trim();

        if (termo.length < 2) {
            document.getElementById('modal-busca-resultados').innerHTML = `
                <div class="modal-busca-placeholder">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <p>Digite ao menos 2 caracteres para pesquisar</p>
                </div>`;
            return;
        }

        debounceTimer = setTimeout(() => {
            buscarItensNoSupabase(termo);
        }, 350);
    });
}

// Executa a busca no Supabase com base no termo e filtros selecionados
async function buscarItensNoSupabase(termo) {
    const spinner = document.getElementById('modal-busca-spinner');
    const resultadosDiv = document.getElementById('modal-busca-resultados');

    // Descobre quais filtros estão marcados
    const checkboxes = document.querySelectorAll('.modal-busca-chip input[type="checkbox"]:checked');
    const colunasFiltradas = Array.from(checkboxes).map(cb => cb.value);

    if (colunasFiltradas.length === 0) {
        resultadosDiv.innerHTML = `<div class="modal-busca-placeholder"><i class="fa-solid fa-filter"></i><p>Selecione ao menos um filtro</p></div>`;
        return;
    }

    spinner.style.display = 'inline-block';
    resultadosDiv.innerHTML = '';

    try {
        // Monta a query com OR entre os campos selecionados
        const filtroOr = colunasFiltradas
            .map(col => `${col}.ilike.%${termo}%`)
            .join(',');

        const { data, error } = await supabaseClient
            .from('itens')
            .select('id, item, ncm, unidade, tipo_item, codigo_fabricante, fabricante')
            .or(filtroOr)
            .order('item', { ascending: true })
            .limit(50);

        if (error) throw error;

        itensBuscados = data;
        renderizarResultados(data, termo);

    } catch (err) {
        console.error('Erro ao buscar itens:', err);
        resultadosDiv.innerHTML = `
            <div class="modal-busca-placeholder erro">
                <i class="fa-solid fa-circle-xmark"></i>
                <p>Erro ao buscar no banco de dados. Tente novamente.</p>
            </div>`;
    } finally {
        spinner.style.display = 'none';
    }
}

// Renderiza a lista de resultados no modal
function renderizarResultados(itens, termo) {
    const resultadosDiv = document.getElementById('modal-busca-resultados');

    if (!itens || itens.length === 0) {
        resultadosDiv.innerHTML = `
            <div class="modal-busca-placeholder">
                <i class="fa-solid fa-box-open"></i>
                <p>Nenhum item encontrado para "<strong>${termo}</strong>"</p>
            </div>`;
        return;
    }

    // Função auxiliar para destacar o termo encontrado em negrito
    function destacar(texto, termo) {
        if (!texto) return '—';
        const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return texto.replace(regex, '<mark>$1</mark>');
    }

    const html = itens.map(item => `
        <div class="modal-busca-item-card" data-id="${item.id}">
            <div class="modal-busca-item-nome">${destacar(item.item, termo)}</div>
            <div class="modal-busca-item-detalhes">
                <span class="modal-busca-badge ncm" title="NCM">
                    <i class="fa-solid fa-tag"></i> ${item.ncm || '—'}
                </span>
                <span class="modal-busca-badge fabricante" title="Fabricante">
                    <i class="fa-solid fa-industry"></i> ${destacar(item.fabricante, termo) || '—'}
                </span>
                <span class="modal-busca-badge codigo" title="Código do Fabricante">
                    <i class="fa-solid fa-barcode"></i> ${destacar(item.codigo_fabricante, termo) || '—'}
                </span>
                <span class="modal-busca-badge tipo" title="Tipo">
                    <i class="fa-solid fa-layer-group"></i> ${item.tipo_item || '—'}
                </span>
            </div>
            <button class="modal-busca-btn-selecionar" onclick="selecionarItemDJO(${item.id})">
                <i class="fa-solid fa-circle-check"></i> Selecionar Item
            </button>
        </div>
    `).join('');

    resultadosDiv.innerHTML = `
        <p class="modal-busca-contagem">${itens.length} item(ns) encontrado(s)</p>
        ${html}
    `;
}

// Preenche os campos do formulário DJO com o item selecionado e fecha o modal
function selecionarItemDJO(itemId) {
    const item = itensBuscados.find(i => i.id === itemId);
    if (!item) return;

    // Preenche os campos visíveis e ocultos do formulário
    document.getElementById('djo-item-selecionado').value = item.item;
    document.getElementById('djo-item-id').value = item.id;
    document.getElementById('djo-item-ncm').value = item.ncm || '';

    fecharModalBuscaItem();
}

// ==========================================
// EXPORTADORES - CARREGA OPÇÕES DO SUPABASE
// ==========================================

async function carregarExportadores() {
    const select = document.getElementById('djo-exportador');
    if (!select) return;

    try {
        const { data, error } = await supabaseClient
            .from('exportadores')
            .select('id, exportador')
            .order('exportador', { ascending: true });

        if (error) throw error;

        // Limpa opções antigas (mantém só o placeholder)
        select.innerHTML = '<option value="" disabled selected>Selecione um exportador...</option>';

        if (!data || data.length === 0) {
            select.innerHTML += '<option disabled>Nenhum exportador cadastrado</option>';
            return;
        }

        data.forEach(exp => {
            const option = document.createElement('option');
            option.value = exp.id;
            option.textContent = exp.exportador;
            select.appendChild(option);
        });

    } catch (err) {
        console.error('Erro ao carregar exportadores:', err);
        select.innerHTML = '<option disabled>Erro ao carregar exportadores</option>';
    }
}

// ==========================================
// INICIALIZAÇÃO DOS EVENTOS DO MÓDULO DJO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    // Botão da lupa para abrir o modal de busca
    const btnLupa = document.getElementById('btn-abrir-busca-item-djo');
    if (btnLupa) {
        btnLupa.addEventListener('click', abrirModalBuscaItem);
    }

    // Carrega os exportadores no select assim que a tela estiver pronta
    carregarExportadores();

    // Injetar os estilos do modal no <head> (evita depender de um CSS externo)
    injetarEstilosModalBusca();
});

// ==========================================
// ESTILOS CSS DO MODAL (INJETADOS VIA JS)
// ==========================================

function injetarEstilosModalBusca() {
    const style = document.createElement('style');
    style.id = 'estilos-modal-busca-item';
    style.textContent = `
        /* === OVERLAY === */
        .modal-busca-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            transition: opacity 0.25s ease;
        }
        .modal-busca-overlay.ativo {
            opacity: 1;
        }

        /* === CARD PRINCIPAL === */
        .modal-busca-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 680px;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(16px);
            transition: transform 0.25s ease;
        }
        .modal-busca-overlay.ativo .modal-busca-card {
            transform: translateY(0);
        }

        /* === HEADER === */
        .modal-busca-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 22px 24px 16px;
            border-bottom: 1px solid #e2e8f0;
            flex-shrink: 0;
        }
        .modal-busca-header h3 {
            margin: 0 0 4px;
            color: #1e3a8a;
            font-size: 18px;
            font-weight: 700;
        }
        .modal-busca-header p {
            margin: 0;
            color: #64748b;
            font-size: 13px;
        }
        .modal-busca-fechar {
            background: #f1f5f9;
            border: none;
            border-radius: 8px;
            width: 36px;
            height: 36px;
            cursor: pointer;
            color: #64748b;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.2s, color 0.2s;
        }
        .modal-busca-fechar:hover {
            background: #fee2e2;
            color: #dc2626;
        }

        /* === CORPO === */
        .modal-busca-corpo {
            display: flex;
            flex-direction: column;
            padding: 18px 24px;
            gap: 14px;
            overflow: hidden;
            flex: 1;
        }

        /* === CAMPO DE INPUT === */
        .modal-busca-campo-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        .modal-busca-icone-input {
            position: absolute;
            left: 14px;
            color: #94a3b8;
            font-size: 15px;
            pointer-events: none;
        }
        .modal-busca-input {
            width: 100%;
            padding: 13px 44px 13px 42px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 14px;
            color: #1e293b;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }
        .modal-busca-input:focus {
            border-color: #1e3a8a;
            box-shadow: 0 0 0 3px rgba(30,58,138,0.1);
        }
        .modal-busca-spinner {
            position: absolute;
            right: 14px;
            color: #1e3a8a;
            font-size: 15px;
        }

        /* === FILTROS (CHIPS) === */
        .modal-busca-filtros {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .modal-busca-filtro-label {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-right: 2px;
        }
        .modal-busca-chip {
            display: flex;
            align-items: center;
            gap: 5px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 5px 11px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
            user-select: none;
        }
        .modal-busca-chip:has(input:checked) {
            background: #dbeafe;
            border-color: #93c5fd;
            color: #1e3a8a;
        }
        .modal-busca-chip input {
            accent-color: #1e3a8a;
            width: 13px;
            height: 13px;
            cursor: pointer;
        }

        /* === ÁREA DE RESULTADOS === */
        .modal-busca-resultados {
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-right: 4px;
        }
        .modal-busca-contagem {
            margin: 0 0 4px;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
        }

        /* === PLACEHOLDER (ESTADO VAZIO/ERRO) === */
        .modal-busca-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 40px 20px;
            color: #94a3b8;
            text-align: center;
        }
        .modal-busca-placeholder i {
            font-size: 28px;
        }
        .modal-busca-placeholder p {
            margin: 0;
            font-size: 14px;
        }
        .modal-busca-placeholder.erro {
            color: #ef4444;
        }

        /* === CARD DE ITEM RESULTADO === */
        .modal-busca-item-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .modal-busca-item-card:hover {
            border-color: #93c5fd;
            box-shadow: 0 2px 8px rgba(30,58,138,0.08);
        }
        .modal-busca-item-nome {
            font-weight: 700;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.4;
        }
        .modal-busca-item-nome mark {
            background: #fef08a;
            color: #1e293b;
            border-radius: 3px;
            padding: 0 2px;
        }
        .modal-busca-item-detalhes {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        /* === BADGES DE INFO === */
        .modal-busca-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
        }
        .modal-busca-badge.ncm         { background: #ecfdf5; color: #065f46; }
        .modal-busca-badge.fabricante  { background: #eff6ff; color: #1e40af; }
        .modal-busca-badge.codigo      { background: #faf5ff; color: #6b21a8; }
        .modal-busca-badge.tipo        { background: #fff7ed; color: #c2410c; }

        /* === BOTÃO SELECIONAR === */
        .modal-busca-btn-selecionar {
            align-self: flex-end;
            background: #0d9488;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 7px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .modal-busca-btn-selecionar:hover {
            background: #0f766e;
        }
        .modal-busca-btn-selecionar:active {
            transform: scale(0.97);
        }

        /* === SCROLLBAR PERSONALIZADA === */
        .modal-busca-resultados::-webkit-scrollbar {
            width: 6px;
        }
        .modal-busca-resultados::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
        }
        .modal-busca-resultados::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        .modal-busca-resultados::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;
    document.head.appendChild(style);
}
