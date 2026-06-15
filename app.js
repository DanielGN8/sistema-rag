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
// Elementos da Tela de Login
const telaLogin = document.getElementById('tela-login');
const conteudoSistema = document.getElementById('conteudo-sistema');
const formLogin = document.getElementById('form-login');

// Elementos do Sistema de Clientes
const formCliente = document.getElementById('form-cliente');
const listaClientes = document.getElementById('lista-clientes');


// ==========================================
// 1. SISTEMA DE ACESSO (LOGIN POR PIN)
// ==========================================
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar

    const usuarioDigitado = document.getElementById('login-usuario').value;
    const pinDigitado = document.getElementById('login-pin').value;

    console.log("Tentando realizar login para:", usuarioDigitado);

    // Busca na tabela 'usuarios' se existe a combinação exata de Usuário e PIN
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

    // Se o banco retornar alguma linha, a combinação está correta
    if (usuarios.length > 0) {
        alert('Acesso liberado!');
        
        // Esconde a tela de login e mostra o sistema
        telaLogin.style.display = 'none';
        conteudoSistema.style.display = 'block';
        
        // Puxa os clientes do banco de dados agora que o acesso foi liberado
        buscarClientes(); 
    } else {
        alert('Usuário ou PIN incorretos. Tente novamente.');
    }
});


// ==========================================
// 2. CADASTRO DE CLIENTES
// ==========================================
formCliente.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    
    const nome = document.getElementById('nome').value;
    const documento = document.getElementById('documento').value;

    console.log("Tentando enviar cliente:", { nome, documento });

    // Insere os dados na tabela do Supabase
    const { data, error } = await supabaseClient
        .from('clientes')
        .insert([{ nome: nome, documento: documento }])
        .select(); // O .select() força o retorno para confirmar a inserção

    if (error) {
        console.error('Erro detalhado do Supabase:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    } else {
        console.log('Sucesso! Cliente salvo:', data);
        alert('Cliente salvo com sucesso!');
        formCliente.reset(); // Limpa os campos do formulário
        buscarClientes();    // Atualiza a lista exibida na tela
    }
});


// ==========================================
// 3. BUSCA E LISTAGEM DE CLIENTES
// ==========================================
async function buscarClientes() {
    console.log("Buscando lista de clientes atualizada...");
    
    const { data: clientes, error } = await supabaseClient
        .from('clientes')
        .select('*');

    if (error) {
        console.error('Erro ao buscar clientes:', error.message);
        return;
    }

    // Limpa a lista antes de desenhar os itens atualizados
    listaClientes.innerHTML = ''; 
    
    // Cria um item na lista para cada cliente encontrado no banco
    clientes.forEach(cliente => {
        const li = document.createElement('li');
        li.textContent = `${cliente.nome} - ${cliente.documento || 'Sem documento'}`;
        listaClientes.appendChild(li);
    });
}

// ==========================================
// NAVIGATION SYSTEM (CONTROLE DE TELAS)
// ==========================================
function mostrarTela(idTela) {
    // Esconde o menu principal de botões
    document.getElementById('menu-principal').style.display = 'none';
    
    // Mostra a tela que o usuário clicou
    document.getElementById(idTela).style.display = 'block';
}

function voltarAoMenu() {
    // Seleciona todas as sub-paginas e esconde-as
    const subPaginas = document.querySelectorAll('.sub-pagina');
    subPaginas.forEach(pagina => pagina.style.display = 'none');
    
    // Mostra o menu principal novamente
    document.getElementById('menu-principal').style.display = 'block';
}
