// =======================================================
// ARQUIVO MODULAR: GERENCIAMENTO E EMISSÃO DE FATURAS
// =======================================================

// Intercepta a função mostrarTela nativa para preparar o estado das abas
const funcaoMostrarTelaOriginalParaFaturas = mostrarTela;
mostrarTela = function(idTela) {
    // Executa o comportamento padrão do sistema de esconder o menu e mostrar a tela cheia
    funcaoMostrarTelaOriginalParaFaturas(idTela);
    
    // Se a tela aberta for a de faturas, força iniciar exibindo a aba de Nova Fatura de forma limpa
    if (idTela === 'painel-faturas') {
        abrirFormularioNovaFatura();
    }
}

// Ativa a exibição do formulário e oculta a listagem
function abrirFormularioNovaFatura() {
    document.getElementById('sub-bloco-lista-faturas').style.display = 'none';
    document.getElementById('sub-bloco-form-fatura').style.display = 'block';
    
    // Opacidade para destacar qual aba está ativa
    document.getElementById('btn-aba-nova').style.opacity = '1';
    document.getElementById('btn-aba-lista').style.opacity = '0.6';
    
    document.getElementById('titulo-form-fatura').innerHTML = `<i class="fa-solid fa-circle-plus"></i> Nova Fatura Comercial`;
}

// Ativa a exibição da listagem e oculta o formulário
function visualizarListaFaturas() {
    document.getElementById('sub-bloco-form-fatura').style.display = 'none';
    document.getElementById('sub-bloco-lista-faturas').style.display = 'block';
    
    document.getElementById('btn-aba-nova').style.opacity = '0.6';
    document.getElementById('btn-aba-lista').style.opacity = '1';
}

// Reseta o formulário
function resetarAbasFatura() {
    document.getElementById('form-fatura').reset();
    document.getElementById('fatura-id-oculto').value = '';
}
