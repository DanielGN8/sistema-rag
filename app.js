// ==========================================
// CONFIGURAÇÃO DE CONEXÃO COM O SUPABASE
// ==========================================
const SUPABASE_URL = "https://pfygllkzjjtttgwdjhlu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeWdsbGt6amp0dHRnd2RqaGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDI5NjMsImV4cCI6MjA5NzExODk2M30.Dd_Y7zyKHLsrorXGBYxiBLcsSCz3kNG3cJvCyTzvSAQ";

// Inicializa o cliente do Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// SELEÇÃO DE ELEMENTOS DO HTML (DOM)
// ==========================================
const telaLogin = document.getElementById('tela-login');
const conteudoSistema = document.getElementById('conteudo-sistema');
const formLogin = document.getElementById('form-login');

// ==========================================
// CONTROLE DE ACESSO (LOGIN POR PIN)
// ==========================================
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usuarioInput = document.getElementById('login-usuario').value.trim();
        const pinInput = document.getElementById('login-pin').value.trim();
        
        try {
            // Busca o usuário na tabela 'usuarios'
            const { data, error } = await supabaseClient
                .from('usuarios')
                .select('*')
                .eq('usuario', usuarioInput)
                .single();
                
            if (error || !data) {
                alert('Usuário não encontrado!');
                return;
            }
            
            // Verifica se o PIN está correto
            if (data.pin === pinInput) {
                // Esconde a tela de login e mostra o sistema
                telaLogin.style.display = 'none';
                conteudoSistema.style.display = 'block';
                
                // MUDANÇA AQUI: Altera dinamicamente o título de boas-vindas do menu
                const usuarioLogadoElement = document.getElementById('usuario-logado');
                if (usuarioLogadoElement) {
                    // Se existir a coluna 'nome' no banco, usa ela, senão usa o próprio nome de usuário
                    usuarioLogadoElement.textContent = data.nome || data.usuario || usuarioInput;
                }
            } else {
                alert('PIN incorreto! Tente novamente.');
            }
            
        } catch (err) {
            console.error('Erro na autenticação:', err);
            alert('Erro ao conectar ao servidor.');
        }
    });
}

// ==========================================
// FUNÇÕES DE NAVEGAÇÃO (SPA)
// ==========================================

// Abre uma tela do menu principal (ex: Nova Fatura, Criar CRT, Adicionar Dados)
function mostrarTela(idTela) {
    console.log("Abrindo tela:", idTela);
    // Esconde o menu principal de boas-vindas
    document.getElementById('menu-principal').style.display = 'none';
    // Mostra a tela escolhida
    document.getElementById(idTela).style.display = 'block';
}

// Abre um formulário específico dentro do Painel de Dados
function mostrarTelaCadastro(idCadastro) {
    console.log("Abrindo cadastro:", idCadastro);
    // Esconde o painel com a grade de botões de dados
    document.getElementById('tela-adicionar-dados').style.display = 'none';
    // Mostra o formulário escolhido
    document.getElementById(idCadastro).style.display = 'block';
}

// Abre um formulário específico dentro do Painel de DJO e NCM
function mostrarTelaDJONCM(idDJONCM) {
    console.log("Abrindo tela DJO/NCM:", idDJONCM);
    // Esconde o painel com a grade de botões de dados
    document.getElementById('tela-djo-ncm').style.display = 'none';
    // Mostra o formulário escolhido
    document.getElementById(idDJONCM).style.display = 'block';
}


// Volta para o menu inicial de boas-vindas limpando qualquer tela aberta
function voltarAoMenu() {
    console.log("Voltando para o Menu Principal...");
    
    // 1. Esconde todas as telas secundárias/formulários
    const telas = document.querySelectorAll('.sub-pagina');
    telas.forEach(t => t.style.display = 'none');

    // 2. Garante que o painel de dados também suma
    document.getElementById('tela-adicionar-dados').style.display = 'none';

    // 3. Mostra o menu principal de boas-vindas
    document.getElementById('menu-principal').style.display = 'block';
}

// Volta especificamente do formulário de cadastro para a grade do Painel de Dados
function voltarAoPainelDados() {
    console.log("Voltando para o Painel de Dados...");
    
    // 1. Esconde as telas de cadastro específicas que usam a classe sub-pagina
    const telas = document.querySelectorAll('.sub-pagina');
    telas.forEach(t => t.style.display = 'none');
    
    // 2. Garante que as sub-telas de cadastro final também fiquem ocultas
    const telasFinais = document.querySelectorAll('.tela-cadastro-final');
    telasFinais.forEach(t => t.style.display = 'none');

    // 3. Reexibe a tela principal com a listagem de botões de dados
    document.getElementById('tela-adicionar-dados').style.display = 'block';
}

// Volta especificamente das sub-páginas para a grade do Painel de DJO e NCMs
function voltarAoPainelDJONCM() {
    console.log("Voltando para o Painel da DJO e NCM...");
    
    // 1. Esconde as telas de cadastro específicas que usam a classe sub-pagina
    const telas = document.querySelectorAll('.sub-pagina');
    telas.forEach(t => t.style.display = 'none');

    // 2. Limpa o campo e o resultado da Consulta NCM ao sair
    const campoBusca = document.getElementById('busca-ncm');
    const resultado = document.getElementById('resultado-ncm-container');
    if (campoBusca) campoBusca.value = '';
    if (resultado) resultado.innerHTML = '';
    
    // 3. Reexibe a tela principal com a listagem de botões de dados
    document.getElementById('tela-djo-ncm').style.display = 'block';
}

// ==========================================
// SISTEMA INTELIGENTE DE ALERTAS PERSONALIZADOS
// ==========================================

// Função que cria o Alerta Estilizado e o injeta dinamicamente na página
function exibirAlertaPersonalizado(titulo, mensagem, tipo = 'info') {
    // Remove popups antigos para não sobrepor se houver cliques rápidos
    const alertaAnterior = document.getElementById('modal-alerta-customizado');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }

    // Configura o ícone ideal dependendo do tipo de aviso
    let iconeHtml = '<i class="fa-solid fa-circle-info"></i>';
    if (tipo === 'sucesso') {
        iconeHtml = '<i class="fa-solid fa-circle-check"></i>';
    } else if (tipo === 'erro') {
        iconeHtml = '<i class="fa-solid fa-circle-xmark"></i>';
    }

    // Cria a estrutura visual completa do modal na página
    const overlay = document.createElement('div');
    overlay.id = 'modal-alerta-customizado';
    overlay.className = 'modal-alerta-overlay';
    overlay.innerHTML = `
        <div class="modal-alerta-card">
            <div class="modal-alerta-icone ${tipo}">
                ${iconeHtml}
            </div>
            <div class="modal-alerta-titulo">${titulo}</div>
            <div class="modal-alerta-mensagem">${mensagem}</div>
            <button class="modal-alerta-botao ${tipo}">Entendido</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Pequena pausa para garantir a animação de "Surgimento" suave
    setTimeout(() => {
        overlay.classList.add('ativo');
    }, 10);

    // Função interna que fecha com transição elegante antes de deletar o elemento do DOM
    const fecharAlerta = () => {
        overlay.classList.remove('ativo');
        setTimeout(() => {
            overlay.remove();
        }, 200);
    };

    // Fechar ao clicar no botão ou na área borrada de fundo
    overlay.querySelector('.modal-alerta-botao').addEventListener('click', fecharAlerta);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            fecharAlerta();
        }
    });
}

// SOBRESCRITA DO ALERT() DO NAVEGADOR
// Isso substitui o "alert" em todos os outros arquivos de script de uma vez só!
window.alert = function(mensagem) {
    const textoMinusculo = mensagem.toLowerCase();
    let tipo = 'info';
    let titulo = 'Aviso do Sistema';

    // Heurística de leitura: Deduz o tipo do alerta pelas palavras-chave da mensagem
    if (textoMinusculo.includes('sucesso') || textoMinusculo.includes('liberado') || textoMinusculo.includes('salvo')) {
        tipo = 'sucesso';
        titulo = 'Sucesso!';
    } else if (textoMinusculo.includes('erro') || textoMinusculo.includes('incorreto') || textoMinusculo.includes('não encontrado') || textoMinusculo.includes('falhou')) {
        tipo = 'erro';
        titulo = 'Ops! Algo deu errado';
    }

    exibirAlertaPersonalizado(titulo, mensagem, tipo);
};
