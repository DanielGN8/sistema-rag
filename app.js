// Substitua pelas suas credenciais reais do painel do Supabase
const SUPABASE_URL = "https://pfygllkzjjtttgwdjhlu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeWdsbGt6amp0dHRnd2RqaGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDI5NjMsImV4cCI6MjA5NzExODk2M30.Dd_Y7zyKHLsrorXGBYxiBLcsSCz3kNG3cJvCyTzvSAQ";

// Inicializa o cliente do Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('form-cliente');
const lista = document.getElementById('lista-clientes');

// 1. Função para Cadastrar Cliente
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    
    const nome = document.getElementById('nome').value;
    const documento = document.getElementById('documento').value;

    console.log("Tentando enviar dados:", { nome, documento });

    // Insere os dados na tabela do Supabase
    const { data, error } = await supabase
        .from('clientes')
        .insert([{ nome: nome, documento: documento }])
        .select(); // O .select() força o Supabase a retornar o dado criado e confirma a inserção

    if (error) {
        console.error('Erro detalhado do Supabase:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    } else {
        console.log('Sucesso! Dados salvos:', data);
        alert('Cliente salvo com sucesso!');
        form.reset();
        buscarClientes(); // Atualiza a lista na tela
    }
});

// 2. Função para Buscar e Listar Clientes
async function buscarClientes() {
    const { data: clientes, error } = await supabase
        .from('clientes')
        .select('*');

    if (error) {
        console.error('Erro ao buscar:', error.message);
        return;
    }

    // Limpa a lista antes de redesenhar
    lista.innerHTML = ''; 
    
    clientes.forEach(cliente => {
        const li = document.createElement('li');
        li.textContent = `${cliente.nome} - ${cliente.documento || 'Sem doc'}`;
        lista.appendChild(li);
    });
}

// Executa a busca assim que a página carrega
buscarClientes();
