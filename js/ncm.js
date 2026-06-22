// ==========================================
// CONSULTA DE NCM
// ==========================================

// Formata o campo de digitação inserindo os pontos automaticamente
// enquanto a pessoa digita só os números (resultado: 0000.00.00)
function formatarEntradaNCM(input) {
    let numeros = input.value.replace(/\D/g, '').substring(0, 8);

    let formatado = numeros;
    if (numeros.length > 4) {
        formatado = `${numeros.substring(0, 4)}.${numeros.substring(4, 6)}`;
    }
    if (numeros.length > 6) {
        formatado = `${numeros.substring(0, 4)}.${numeros.substring(4, 6)}.${numeros.substring(6, 8)}`;
    }

    input.value = formatado;
}

// Formata o texto da descrição com dois efeitos visuais:
// 1. Todo dígito (0-9) fica em negrito e azul chamativo
// 2. Insere uma quebra de linha antes do código exato que foi pesquisado,
//    destacando-o como uma "âncora" no meio do texto concatenado
function formatarDescricaoNCM(texto, codigoPesquisado) {
    // Escapa caracteres especiais do código para usar em regex com segurança
    const codigoEscapado = codigoPesquisado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Passo 1: insere <br> antes do código exato pesquisado
    texto = texto.replace(
        new RegExp(codigoEscapado, 'g'),
        `<br>${codigoPesquisado}`
    );

    // Passo 2: envolve cada dígito com uma span estilizada (negrito + azul)
    texto = texto.replace(/\d/g, '<span class="ncm-digito">$&</span>');

    return texto;
}

// Consulta o código digitado na tabela 'ncm_exp' do Supabase
// e exibe a descrição encontrada (ou um aviso de "não encontrado")
async function pesquisarNCM() {
    const inputBusca = document.getElementById('busca-ncm');
    const container = document.getElementById('resultado-ncm-container');
    const btn = document.getElementById('btn-pesquisar-ncm');

    if (!inputBusca || !container || !btn) return;

    const codigo = inputBusca.value.trim();

    if (!codigo) {
        alert('Digite um código NCM para pesquisar.');
        return;
    }

    const textoOriginalBtn = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Pesquisando...';
    container.innerHTML = '';

    try {
        const { data, error } = await supabaseClient
            .from('ncm_exp')
            .select('codigo_ncm, descricao_concatenada')
            .eq('codigo_ncm', codigo)
            .maybeSingle();

        if (error) {
            console.error('Erro ao consultar NCM:', error);
            alert('Erro ao consultar o NCM. Tente novamente.');
            return;
        }

        if (!data) {
            container.innerHTML = `
                <div class="resultado-ncm-card nao-encontrado">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <div>
                        <strong>NCM não encontrado</strong>
                        <p>O código <strong>${codigo}</strong> não foi localizado na base de dados.</p>
                    </div>
                </div>
            `;
            return;
        }

        const descricaoFormatada = formatarDescricaoNCM(data.descricao_concatenada, codigo);

        container.innerHTML = `
            <div class="resultado-ncm-card">
                <i class="fa-solid fa-circle-check"></i>
                <div>
                    <div class="resultado-ncm-codigo">${data.codigo_ncm}</div>
                    <div class="resultado-ncm-descricao">${descricaoFormatada}</div>
                </div>
            </div>
        `;

    } catch (err) {
        console.error('Erro na consulta NCM:', err);
        alert('Erro ao conectar ao servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginalBtn;
    }
}
