// ==========================================================================
// MÓDULO DE CONSULTA DE NCM - RAG DESPACHOS (MÁSCARA CORRIGIDA + BOTÃO)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const inputNcm = document.getElementById('pesquisa-ncm-input');
    const btnPesquisar = document.getElementById('btn-pesquisar-ncm');
    
    if (inputNcm) {
        // Máscara estilo CPF/CNPJ ativa em tempo real enquanto digita
        inputNcm.addEventListener('input', (e) => {
            let valor = e.target.value;
            
            // Remove tudo o que não for número
            valor = valor.replace(/\D/g, "");
            
            // Aplica os pontos conforme a pessoa digita cada caractere (XXXX.XX.XX)
            if (valor.length > 6) {
                valor = valor.replace(/^(\d{4})(\d{2})(\d{2}).*/, "$1.$2.$3");
            } else if (valor.length > 4) {
                valor = valor.replace(/^(\d{4})(\d{2})/, "$1.$2");
            } else if (valor.length > 0) {
                // Apenas garante que não passe de 8 dígitos brutos antes de formatar
                if(valor.length > 8) valor = valor.slice(0,8);
            }
            
            e.target.value = valor;
        });

        // Evento de clique no botão de pesquisar
        if (btnPesquisar) {
            btnPesquisar.addEventListener('click', () => {
                executarBuscaNCM(inputNcm.value);
            });
        }

        // Caso o usuário prefira apertar Enter no teclado
        inputNcm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executarBuscaNCM(inputNcm.value);
            }
        });
    }
});

/**
 * Realiza a consulta na tabela ncm_exp do Supabase
 */
async function ejecutarBuscaNCM(codigoFormatado) {
    const containerResultado = document.getElementById('resultado-ncm-container');
    const statusPesquisa = document.getElementById('status-pesquisa-ncm');
    const txtCodigo = document.getElementById('res-codigo-ncm');
    const txtDescricao = document.getElementById('res-descricao-ncm');

    // Validação de tamanho mínimo (pelo menos os 4 primeiros dígitos básicos do NCM)
    const digitosLimpos = codigoFormatado.replace(/\D/g, "");
    if (digitosLimpos.length < 4) {
        exibirStatusNCM("Por favor, digite pelo menos os 4 primeiros números para pesquisar.", "#fef2f2", "#ef4444");
        containerResultado.style.display = 'none';
        return;
    }

    // Alerta visual de carregamento
    exibirStatusNCM('<i class="fa-solid fa-spinner fa-spin"></i> Consultando banco de dados aduaneiro...', "#f0fdf4", "#16a34a");
    containerResultado.style.display = 'none';

    try {
        let query = supabaseClient
            .from('ncm_exp')
            .select('codigo_ncm, descricao_ncm');

        // Se digitou os 8 números completos (com pontos fica tamanho 10), faz busca exata
        if (codigoFormatado.length === 10) {
            query = query.eq('codigo_ncm', codigoFormatado);
        } else {
            // Se digitou parcial (ex: 8517), busca por aproximação usando ILIKE
            query = query.ilike('codigo_ncm', `%${codigoFormatado}%`);
        }

        // Usamos .maybeSingle() para buscas exatas ou pegamos o primeiro resultado parcial encontrado
        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
            statusPesquisa.style.display = 'none'; // esconde o carregamento
            txtCodigo.innerText = data.codigo_ncm;
            txtDescricao.innerText = data.descricao_ncm;
            containerResultado.style.display = 'block';
        } else {
            containerResultado.style.display = 'none';
            exibirStatusNCM(`<i class="fa-solid fa-triangle-exclamation"></i> NCM <strong>${codigoFormatado}</strong> não foi encontrado na tabela atual.`, "#fffbeb", "#d97706");
        }

    } catch (err) {
        console.error("Erro ao buscar NCM:", err);
        containerResultado.style.display = 'none';
        exibirStatusNCM(`<i class="fa-solid fa-circle-xmark"></i> Erro ao conectar ao Supabase. Tente novamente.`, "#fef2f2", "#ef4444");
    }
}

function exibirStatusNCM(mensagem, bg, corTexto) {
    const statusPesquisa = document.getElementById('status-pesquisa-ncm');
    statusPesquisa.innerHTML = message = mensagem;
    statusPesquisa.style.backgroundColor = bg;
    statusPesquisa.style.color = corTexto;
    statusPesquisa.style.display = 'block';
}
