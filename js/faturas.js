// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO E EMISSÃO DE FATURAS
// =======================================================

// Intercepta a abertura da tela principal de faturas para limpar sub-blocos
const funcaoMostrarTelaCadastroOriginalParaFaturas = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    funcaoMostrarTelaCadastroOriginalParaFaturas(idCadastro);
    if (idCadastro === 'painel-faturas') {
        fecharSubBlocosFatura();
    }
}

// Abre a área de preenchimento de uma nova fatura
function abrirFormularioNovaFatura() {
    fecharSubBlocosFatura();
    document.getElementById('sub-bloco-form-fatura').style.display = 'block';
    document.getElementById('titulo-form-fatura').innerHTML = `<i class="fa-solid fa-circle-plus"></i> Nova Fatura Comercial`;
    document.getElementById('sub-bloco-form-fatura').scrollIntoView({ behavior: 'smooth' });
}

// Abre a área de listagem e busca de faturas existentes
function visualizarListaFaturas() {
    fecharSubBlocosFatura();
    document.getElementById('sub-bloco-lista-faturas').style.display = 'block';
    document.getElementById('sub-bloco-lista-faturas').scrollIntoView({ behavior: 'smooth' });
    
    // Chamar função de carregar dados do banco futuramente:
    // buscarFaturasBanco();
}

// Oculta os formulários e tabelas internas do sub-painel
function fecharSubBlocosFatura() {
    document.getElementById('sub-bloco-form-fatura').style.display = 'none';
    document.getElementById('sub-bloco-lista-faturas').style.display = 'none';
    document.getElementById('form-fatura').reset();
    document.getElementById('fatura-id-oculto').value = '';
}
