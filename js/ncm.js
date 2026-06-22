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

        container.innerHTML = `
            <div class="resultado-ncm-card">
                <i class="fa-solid fa-circle-check"></i>
                <div>
                    <div class="resultado-ncm-codigo">${data.codigo_ncm}</div>
                    <div class="resultado-ncm-descricao">${data.descricao_concatenada}</div>
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
