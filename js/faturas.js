// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO E EMISSÃO DE FATURAS
// =======================================================

// Intercepta a abertura da página de faturas para garantir comportamento idêntico aos itens
const funcaoMostrarTelaCadastroOriginalParaFaturas = mostrarTelaCadastro;
mostrarTelaCadastro = function(idCadastro) {
    // Executa a função padrão do seu sistema para esconder o painel principal e exibir a div correta
    funcaoMostrarTelaCadastroOriginalParaFaturas(idCadastro);
    
    if (idCadastro === 'painel-faturas') {
        // Quando entra na página, por padrão exibe o formulário de Nova Fatura para ficar pronto para o uso
        abrirFormularioNovaFatura();
    }
}

// Ativa a aba de Nova Fatura e esconde a listagem
function abrirFormularioNovaFatura() {
    document.getElementById('sub-bloco-lista-faturas').style.style.display = 'none';
    document.getElementById('sub-bloco-form-fatura').style.display = 'block';
    
    // Feedback visual nos botões de cima (opcional, deixa mais elegante)
    document.getElementById('btn-aba-nova').style.opacity = '1';
    document.getElementById('btn-aba-lista').style.opacity = '0.6';
    
    document.getElementById('titulo-form-fatura').innerHTML = `<i class="fa-solid fa-circle-plus"></i> Nova Fatura Comercial`;
}

// Ativa a aba de Listagem e esconde o formulário
function visualizarListaFaturas() {
    document.getElementById('sub-bloco-form-fatura').style.display = 'none';
    document.getElementById('sub-bloco-lista-faturas').style.display = 'block';
    
    document.getElementById('btn-aba-nova').style.opacity = '0.6';
    document.getElementById('btn-aba-lista').style.opacity = '1';
    
    // Se quiser carregar dados do Supabase automaticamente ao clicar:
    // buscarFaturasBanco();
}

// Reseta o formulário interno sem fechar a página
function resetarAbasFatura() {
    document.getElementById('form-fatura').reset();
    document.getElementById('fatura-id-oculto').value = '';
}
