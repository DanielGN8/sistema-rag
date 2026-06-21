// ==========================================================================
// MÓDULO DE CONSULTA DE NCM - RAG DESPACHOS
// Tabela Supabase: ncm_exp | Colunas: codigo_ncm, descricao_ncm
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const inputNcm = document.getElementById('pesquisa-ncm-input');
    
    if (inputNcm) {
        // Aplica a máscara enquanto o usuário digita
        inputNcm.addEventListener('input', (e) => {
            let valor = e.target.value;
            
            // Remove tudo o que não for número
            valor = valor.replace(/\D/g, "");
            
            // Limita a 8 dígitos numéricos brutos
            if (valor.length > 8) {
                valor = valor.slice(0, 8);
            }
            
            // Aplica a formatação XXXX.XX.XX dinamicamente
            if (valor.length > 6) {
                valor = valor.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1.$2.$3");
            } else if (valor.length > 4) {
                valor = valor.replace(/^(\d{4})(\d{2})/, "$1.$2.");
            } else if (valor.length > 4) {
                valor = valor.replace(/^(\d{4})/, "$1.");
            }
            
            e.target.value = valor;

            // Se completou os 8 números (considerando os 2 pontos fica com tamanho 10), busca direto
            if (valor.length === 10) {
                executarBuscaNCM(valor);
            }
        });

        // Caso o usuário aperte Enter na pesquisa
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
 * @param {string} codigoFormatado Exemplo: "8517.13.00"
 */
async function executarBuscaNCM(codigoFormatado) {
    const containerResultado = document.getElementById('resultado-ncm-container');
    const statusPesquisa = document.getElementById('status-pesquisa-ncm');
    const txtCodigo = document.getElementById('res-codigo-ncm');
    const txtDescricao = document.getElementById('res-descricao-ncm');

    // Validação básica: verifica se tem caracteres suficientes
    if (codigoFormatado.trim().length < 4) {
        exibirStatusNCM("Digite pelo menos 4 números para buscar.", "#fef2f2", "#ef4444");
        containerResultado.style.display = 'none';
        return;
    }

    // Alerta visual de carregamento
    exibirStatusNCM('<i class="fa-solid fa-spinner fa-spin"></i> Consultando tabela de 15 mil itens no banco...', "#f0fdf4", "#16a34a");
    containerResultado.style.style = 'none';

    try {
        // Faz a busca no Supabase utilizando o cliente global 'supabaseClient' já definido no seu app.js
        // Se o usuário digitou o NCM incompleto (ex: 8517), ele procura por aproximação usando o .ilike()
        const termoBusca = codigoFormatado.includes('.') ? codigoFormatado : `%${codigoFormatado}%`;
        
        let query = supabaseClient
            .from('ncm_exp')
            .select('codigo_ncm, descricao_ncm');

        if (codigoFormatado.length === 10) {
            // Busca exata se o NCM estiver completo
            query = query.eq('codigo_ncm', codigoFormatado);
        } else {
            // Busca parcial caso falte dígitos
            query = query.ilike('codigo_ncm', `%${codigoFormatado}%`);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
            // Esconde o status de carregamento e exibe a tabela populada
            statusPesquisa.style.display = 'none';
            txtCodigo.innerText = data.codigo_ncm;
            txtDescricao.innerText = data.descricao_ncm;
            containerResultado.style.display = 'block';
        } else {
            // NCM não cadastrado
            containerResultado.style.display = 'none';
            exibirStatusNCM(`<i class="fa-solid fa-triangle-exclamation"></i> O NCM <strong>${codigoFormatado}</strong> não foi localizado na tabela atual.`, "#fffbeb", "#d97706");
        }

    } catch (err) {
        console.error("Erro ao buscar NCM:", err);
        containerResultado.style.display = 'none';
        exibirStatusNCM(`<i class="fa-solid fa-circle-xmark"></i> Erro de comunicação com o Supabase. Verifique a internet.`, "#fef2f2", "#ef4444");
    }
}

/**
 * Função utilitária para renderizar avisos na tela de consulta
 */
function exibirStatusNCM(mensagem, bg, corTexto) {
    const statusPesquisa = document.getElementById('status-pesquisa-ncm');
    statusPesquisa.innerHTML = mensagem;
    statusPesquisa.style.backgroundColor = bg;
    statusPesquisa.style.color = corTexto;
    statusPesquisa.style.display = 'block';
}
