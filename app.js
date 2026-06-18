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
