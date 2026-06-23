// ==========================================
// MÓDULO: DECLARAÇÃO JURAMENTADA DE ORIGEM (DJO)
// ==========================================

// Item atualmente selecionado para gerar a DJO
let itemSelecionadoDJO = null;

// Debounce timer para não disparar busca a cada tecla
let timerBuscaDJO = null;

// ==========================================
// BUSCA DE ITENS
// ==========================================

// Dispara a busca com um pequeno delay para não sobrecarregar o Supabase
function pesquisarItemDJO(termo) {
    clearTimeout(timerBuscaDJO);

    const container = document.getElementById('djo-resultados-container');

    if (!termo || termo.trim().length < 2) {
        container.innerHTML = '<p class="djo-hint"><i class="fa-solid fa-circle-info"></i> Digite pelo menos 2 caracteres para buscar.</p>';
        return;
    }

    container.innerHTML = '<p class="djo-hint"><i class="fa-solid fa-spinner fa-spin"></i> Buscando...</p>';

    timerBuscaDJO = setTimeout(() => executarBuscaDJO(termo.trim()), 400);
}

async function executarBuscaDJO(termo) {
    const container = document.getElementById('djo-resultados-container');

    try {
        const { data, error } = await supabaseClient
            .from('itens')
            .select('id, item, unidade, ncm, tipo_item, processo_prod, codigo_fabricante, fabricante')
            .or(
                `item.ilike.%${termo}%,` +
                `ncm.ilike.%${termo}%,` +
                `codigo_fabricante.ilike.%${termo}%,` +
                `fabricante.ilike.%${termo}%`
            )
            .order('item', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Erro ao buscar itens:', error);
            container.innerHTML = '<p class="djo-hint djo-hint-erro"><i class="fa-solid fa-circle-xmark"></i> Erro ao buscar itens. Tente novamente.</p>';
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="djo-hint"><i class="fa-solid fa-circle-exclamation"></i> Nenhum item encontrado para "<strong>' + termo + '</strong>".</p>';
            return;
        }

        renderizarResultadosDJO(data);

    } catch (err) {
        console.error('Erro na busca DJO:', err);
        container.innerHTML = '<p class="djo-hint djo-hint-erro"><i class="fa-solid fa-circle-xmark"></i> Erro ao conectar ao servidor.</p>';
    }
}

// Cache dos resultados da última busca (evita embutir JSON em onclick)
let cacheBuscaDJO = [];

// Renderiza a tabela de resultados da busca
function renderizarResultadosDJO(itens) {
    cacheBuscaDJO = itens; // guarda no cache para o onclick usar pelo índice
    const container = document.getElementById('djo-resultados-container');

    const linhas = itens.map((item, idx) => `
        <tr class="djo-linha-resultado" onclick="selecionarItemDJO(${idx})">
            <td>${item.item || '—'}</td>
            <td>${item.codigo_fabricante || '—'}</td>
            <td>${item.fabricante || '—'}</td>
            <td>${item.ncm || '—'}</td>
            <td>${item.unidade || '—'}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">
            <i class="fa-solid fa-list"></i> ${itens.length} resultado(s) encontrado(s). Clique em um item para selecioná-lo.
        </p>
        <div class="tabela-container">
            <table class="tabela-moderna">
                <thead>
                    <tr>
                        <th>Item / Descrição</th>
                        <th>Cód. Fabricante</th>
                        <th>Fabricante</th>
                        <th>NCM</th>
                        <th>Unidade</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}

// ==========================================
// SELEÇÃO DO ITEM
// ==========================================

function selecionarItemDJO(idx) {
    const item = cacheBuscaDJO[idx];
    if (!item) return;
    itemSelecionadoDJO = item;

    // Esconde os resultados e limpa a busca
    document.getElementById('djo-resultados-container').innerHTML =
        '<p class="djo-hint djo-hint-sucesso"><i class="fa-solid fa-circle-check"></i> Item selecionado com sucesso.</p>';
    document.getElementById('busca-item-djo').value = '';
    document.getElementById('busca-item-djo').disabled = true;

    // Monta o card de item selecionado
    const infoEl = document.getElementById('djo-item-selecionado-info');
    infoEl.innerHTML = `
        <div class="djo-info-campo">
            <label>Item / Descrição</label>
            <p>${item.item || '—'}</p>
        </div>
        <div class="djo-info-campo">
            <label>Código do Fabricante</label>
            <p>${item.codigo_fabricante || '—'}</p>
        </div>
        <div class="djo-info-campo">
            <label>Fabricante</label>
            <p>${item.fabricante || '—'}</p>
        </div>
        <div class="djo-info-campo">
            <label>NCM</label>
            <p>${item.ncm || '—'}</p>
        </div>
        <div class="djo-info-campo">
            <label>Unidade</label>
            <p>${item.unidade || '—'}</p>
        </div>
        <div class="djo-info-campo">
            <label>Tipo do Item</label>
            <p>${item.tipo_item || '—'}</p>
        </div>
        <div class="djo-info-campo">
            <label>Processo de Produção</label>
            <p>${item.processo_prod || '—'}</p>
        </div>
    `;

    // Exibe o card e o bloco de campos obrigatórios
    document.getElementById('djo-item-selecionado-card').style.display = 'block';
    document.getElementById('djo-campos-obrigatorios').style.display = 'block';

    // Rola suavemente até a próxima etapa
    document.getElementById('djo-item-selecionado-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Reseta a seleção e volta ao estado inicial
function limparSelecaoDJO() {
    itemSelecionadoDJO = null;

    document.getElementById('djo-item-selecionado-card').style.display = 'none';
    document.getElementById('djo-campos-obrigatorios').style.display = 'none';
    document.getElementById('djo-item-selecionado-info').innerHTML = '';

    const busca = document.getElementById('busca-item-djo');
    busca.value = '';
    busca.disabled = false;
    busca.focus();

    document.getElementById('djo-resultados-container').innerHTML =
        '<p class="djo-hint"><i class="fa-solid fa-circle-info"></i> Digite pelo menos 2 caracteres para buscar.</p>';
}

// ==========================================
// CAMPOS OBRIGATÓRIOS
// ==========================================

// Ativa/desativa o campo de data manual conforme o checkbox
function toggleDataDJO() {
    const usarHoje = document.getElementById('djo-usar-data-hoje').checked;
    const campoData = document.getElementById('djo-data-manual');

    campoData.disabled = usarHoje;
    campoData.style.opacity = usarHoje ? '0.45' : '1';
    campoData.style.cursor = usarHoje ? 'not-allowed' : 'text';

    if (!usarHoje) {
        campoData.focus();
    } else {
        campoData.value = '';
    }
}

// Retorna a data formatada para o documento (DD/MM/YYYY)
function obterDataDJO() {
    const usarHoje = document.getElementById('djo-usar-data-hoje').checked;

    if (usarHoje) {
        const hoje = new Date();
        return hoje.toLocaleDateString('pt-BR');
    }

    const campoData = document.getElementById('djo-data-manual');
    if (!campoData.value) return null;

    const [ano, mes, dia] = campoData.value.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ==========================================
// GERAÇÃO DA DJO
// ==========================================

function gerarDJO() {
    // — Validações —
    if (!itemSelecionadoDJO) {
        alert('Selecione um item antes de gerar a DJO.');
        return;
    }

    const numeroDJO = document.getElementById('djo-numero').value.trim();
    if (!numeroDJO) {
        alert('Preencha o Número da DJO antes de continuar.');
        document.getElementById('djo-numero').focus();
        return;
    }

    const dataDJO = obterDataDJO();
    if (!dataDJO) {
        alert('Informe a data do documento ou marque "Usar data de hoje".');
        document.getElementById('djo-data-manual').focus();
        return;
    }

    const exportadorEProdutor = document.getElementById('djo-exportador-produtor').checked;

    // — Monta o pacote de dados para o documento —
    const dadosDJO = {
        item: itemSelecionadoDJO,
        numeroDJO,
        data: dataDJO,
        exportadorEProdutor,
    };

    // — Abre o documento em nova aba —
    abrirDocumentoDJO(dadosDJO);
}

// Gera e abre o HTML do documento em uma nova aba
function abrirDocumentoDJO(dados) {
    const { item, numeroDJO, data, exportadorEProdutor } = dados;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>DJO Nº ${numeroDJO}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 30px; }
        h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
        .subtitulo { text-align: center; font-size: 11pt; margin-bottom: 24px; }
        .numero-djo { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 24px; }
        .secao { margin-bottom: 18px; }
        .secao label { font-weight: bold; display: block; margin-bottom: 2px; }
        .campo-doc { border-bottom: 1px solid #000; min-height: 22px; padding: 2px 4px; margin-bottom: 10px; }
        .rodape { margin-top: 40px; font-size: 10pt; text-align: center; color: #555; border-top: 1px solid #ccc; padding-top: 12px; }
        @media print { body { padding: 10mm; } .rodape { position: fixed; bottom: 0; width: 100%; } }
    </style>
</head>
<body>
    <h1>DECLARAÇÃO JURAMENTADA DE ORIGEM</h1>
    <div class="subtitulo">Acordo de Livre Comércio Mercosul — Norma de Origem A</div>
    <div class="numero-djo">Nº ${numeroDJO} &nbsp;|&nbsp; ${data}</div>

    <div class="secao">
        <label>Item / Produto:</label>
        <div class="campo-doc">${item.item || ''}</div>
    </div>

    <div class="secao">
        <label>Código do Fabricante:</label>
        <div class="campo-doc">${item.codigo_fabricante || ''}</div>
    </div>

    <div class="secao">
        <label>Fabricante:</label>
        <div class="campo-doc">${item.fabricante || ''}</div>
    </div>

    ${exportadorEProdutor ? '<div class="secao"><label>Produtor:</label><div class="campo-doc">(Mesmo que o Exportador)</div></div>' : '<div class="secao"><label>Produtor:</label><div class="campo-doc"></div></div>'}

    <div class="secao">
        <label>NCM:</label>
        <div class="campo-doc">${item.ncm || ''}</div>
    </div>

    <div class="secao">
        <label>Unidade:</label>
        <div class="campo-doc">${item.unidade || ''}</div>
    </div>

    <div class="secao">
        <label>Processo de Produção:</label>
        <div class="campo-doc">${item.processo_prod || ''}</div>
    </div>

    <div class="rodape">Documento gerado em ${data} — Sistema RAG Despachos</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
