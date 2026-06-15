// ==========================================
// CONFIGURAÇÃO DE CONEXÃO COM O SUPABASE
// ==========================================
// Substitua com as credenciais reais do seu painel do Supabase
const SUPABASE_URL = "https://pfygllkzjjtttgwdjhlu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeWdsbGt6amp0dHRnd2RqaGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDI5NjMsImV4cCI6MjA5NzExODk2M30.Dd_Y7zyKHLsrorXGBYxiBLcsSCz3kNG3cJvCyTzvSAQ";

// Inicializa o cliente do Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// SELEÇÃO DE ELEMENTOS DO HTML (DOM)
// ==========================================
// Elementos de Login e Telas Principais
const telaLogin = document.getElementById('tela-login');
const conteudoSistema = document.getElementById('conteudo-sistema');
const formLogin = document.getElementById('form-login');

// Elementos do Formulário de Exportadores (Antigo Clientes)
const formCliente = document.getElementById('form-cliente');
const listaClientes = document.getElementById('lista-clientes');


// ==========================================
// 1. SISTEMA DE ACESSO (LOGIN POR PIN)
// ==========================================
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioDigitado = document.getElementById('login-usuario').value;
    const pinDigitado = document.getElementById('login-pin').value;

    console.log("Tentando realizar login para:", usuarioDigitado);

    const { data: usuarios, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('usuario', usuarioDigitado)
        .eq('pin', pinDigitado);

    if (error) {
        console.error('Erro ao verificar login:', error.message);
        alert('Erro no servidor ao tentar realizar o login.');
        return;
    }

    if (usuarios.length > 0) {
        alert('Acesso liberado!');
        
        telaLogin.style.display = 'none';
        conteudoSistema.style.display = 'block'; // Corrigido aqui!
        
        // Carrega os dados dos exportadores preventivamente
        buscarClientes(); 
    } else {
        alert('Usuário ou PIN incorretos. Tente novamente.');
    }
});


// ==========================================
// 2. CADASTRO DE EXPORTADORES (SUA TABELA DE CLIENTES)
// ==========================================
formCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const documento = document.getElementById('documento').value;

    console.log("Tentando enviar exportador:", { nome, documento });

    const { data, error } = await supabaseClient
        .from('clientes') // Continua usando sua tabela 'clientes' do banco
        .insert([{ nome: nome, documento: documento }])
        .select();

    if (error) {
        console.error('Erro detalhado do Supabase:', error);
        alert('Erro ao salvar exportador: ' + error.message);
    } else {
        console.log('Sucesso! Exportador salvo:', data);
        alert('Exportador salvo com sucesso!');
        formCliente.reset();
        buscarClientes(); 
    }
});


// ==========================================
// 3. BUSCA E LISTAGEM DE EXPORTADORES
// ==========================================
async function buscarClientes() {
    console.log("Buscando lista de exportadores...");
    
    const { data: clientes, error } = await supabaseClient
        .from('clientes')
        .select('*');

    if (error) {
        console.error('Erro ao buscar exportadores:', error.message);
        return;
    }

    listaClientes.innerHTML = ''; 
    
    clientes.forEach(cliente => {
        const li = document.createElement('li');
        li.textContent = `${cliente.nome} - ${cliente.documento || 'Sem documento'}`;
        listaClientes.appendChild(li);
    });
}


// ==========================================
// 4. NAVIGATION SYSTEM (SISTEMA DE NAVEGAÇÃO)
// ==========================================

// Abre Fatura, CRT, MIC ou Painel de Dados vindo do Menu Principal
function mostrarTela(idTela) {
    document.getElementById('menu-principal').style.display = 'none';
    document.getElementById(idTela).style.display = 'block';
}

// Volta de qualquer sub-painel para o Menu Principal de Boas-Vindas
function voltarAoMenu() {
    const subPaginas = document.querySelectorAll('.sub-pagina');
    subPaginas.forEach(pagina => pagina.style.display = 'none');
    
    const telasCadastro = document.querySelectorAll('.tela-cadastro-final');
    telasCadastro.forEach(tela => tela.style.display = 'none');

    document.getElementById('menu-principal').style.display = 'block';
}

// Abre um formulário de cadastro final vindo do Painel de Dados
function mostrarTelaCadastro(idCadastro) {
    document.getElementById('tela-adicionar-dados').style.display = 'none';
    document.getElementById(idCadastro).style.display = 'block';
}

// Volta de um formulário de cadastro final para o Painel de Dados intermediário
function voltarAoPainelDados() {
    const telasCadastro = document.querySelectorAll('.tela-cadastro-final');
    telasCadastro.forEach(tela => tela.style.display = 'none');
    
    document.getElementById('tela-adicionar-dados').style.display = 'block';
}
