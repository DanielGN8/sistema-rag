// js/djo.js

async function emitirDJO(idProduto) {
    try {
        // 1. Buscar os dados completos do produto no Supabase
        const { data: produto, error: errorProd } = await _supabase
            .from('itens') // ou o nome exato da sua tabela
            .select('*')
            .eq('id', idProduto)
            .single();

        if (errorProd) throw errorProd;

        // 2. Buscar os dados do Exportador/Fabricante vinculado
        const { data: exportador, error: errorExp } = await _supabase
            .from('exportadores')
            .eq('id', produto.id_exportador) // Ajuste conforme sua chave estrangeira
            .single();

        // 3. Criar uma janela temporária (Iframe ou Nova Aba) para a impressão
        // Isso evita que o CSS da sua aplicação interfira no layout do documento
        const janelaImpressao = window.open('', '_blank');
        
        // 4. Injetar o HTML e o CSS estruturado da DJO
        janelaImpressao.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Declaração Juramentada de Origem - ALADI / MERCOSUL</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm 15mm;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 11pt;
                        line-height: 1.4;
                        color: #000;
                        background: #fff;
                    }
                    .header {
                        text-align: center;
                        text-transform: uppercase;
                        font-weight: bold;
                        margin-bottom: 25px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .titulo {
                        font-size: 14pt;
                        margin-bottom: 5px;
                    }
                    .subtitulo {
                        font-size: 10pt;
                        font-weight: normal;
                    }
                    .secao {
                        margin-bottom: 20px;
                        border: 1px solid #000;
                        padding: 10px;
                    }
                    .secao-titulo {
                        font-weight: bold;
                        text-transform: uppercase;
                        background-color: #f0f0f0;
                        margin: -10px -10px 10px -10px;
                        padding: 5px 10px;
                        border-bottom: 1px solid #000;
                        font-size: 10pt;
                    }
                    .grid-2 {
                        display: table;
                        width: 100%;
                    }
                    .col {
                        display: table-cell;
                        width: 50%;
                        vertical-align: top;
                    }
                    .texto-declaracao {
                        text-align: justify;
                        text-indent: 30px;
                        margin: 25px 0;
                    }
                    .assinatura-container {
                        margin-top: 60px;
                        text-align: center;
                        display: table;
                        width: 100%;
                    }
                    .bloco-assinatura {
                        display: table-cell;
                        width: 50%;
                        text-align: center;
                    }
                    .linha-assinatura {
                        border-top: 1px solid #000;
                        width: 80%;
                        margin: 0 auto 5px auto;
                    }
                </style>
            </head>
            <body>

                <div class="header">
                    <div class="titulo">Declaração Juramentada de Origem</div>
                    <div class="subtitulo">Acordo de Complementação Econômica ACE nº 18 (MERCOSUL)</div>
                </div>

                <div class="secao">
                    <div class="secao-titulo">1. Entidade Exportadora / Produtora</div>
                    <strong>Razão Social:</strong> ${exportador?.razao_social || 'N/A'}<br>
                    <strong>Endereço:</strong> ${exportador?.endereco || 'N/A'}<br>
                    <strong>Identificação Fiscal (CNPJ/RUT):</strong> ${exportador?.cnpj || 'N/A'}
                </div>

                <div class="secao">
                    <div class="secao-titulo">2. Descrição da Mercadoria</div>
                    <div class="grid-2">
                        <div class="col">
                            <strong>Denominação Comercial:</strong> ${produto.descricao || 'N/A'}<br>
                            <strong>NCM:</strong> ${produto.ncm || 'N/A'}
                        </div>
                        <div class="col">
                            <strong>Tipo de Carga:</strong> ${produto.tipo_carga || 'N/A'}<br>
                            <strong>Fabricante:</strong> ${produto.fabricante || 'Provedor Próprio'}
                        </div>
                    </div>
                </div>

                <div class="secao">
                    <div class="secao-titulo">3. Processo Produtivo e Critério de Origem</div>
                    <p style="margin: 0; font-size: 10pt;">
                        ${produto.processo_produtivo || 'O processo produtivo consiste na transformação de insumos nacionais/importados em conformidade com as regras de origem estabelecidas no regime aduaneiro vigente.'}
                    </p>
                </div>

                <div class="texto-declaracao">
                    Declaramos sob juramento que a mercadoria acima detalhada cumpre com as disposições estabelecidas nas normas de origem do Acordo de Complementação Econômica correspondente, sendo a informação consignada nesta declaração fiel e verdadeira, assumindo a responsabilidade legal por qualquer inexatidão.
                </div>

                <p style="text-align: right; margin-top: 40px;">
                    Foz do Iguaçu, ${new Date().toLocaleDateString('pt-BR')}.
                </p>

                <div class="assinatura-container">
                    <div class="bloco-assinatura">
                        <div class="linha-assinatura"></div>
                        <span>Assinatura do Exportador / Representante Legal</span><br>
                        <small>(Assinatura Manual ou Certificado Digital)</small>
                    </div>
                </div>

            </body>
            </html>
        `);

        // 5. Executar a impressão e fechar a janela/aba temporária após o comando
        janelaImpressao.document.close();
        janelaImpressao.focus();
        
        // Timeout curto para garantir que o conteúdo HTML foi renderizado antes de chamar o print
        setTimeout(() => {
            janelaImpressao.print();
            janelaImpressao.close();
        }, 250);

    } catch (err) {
        console.error("Erro ao emitir DJO:", err);
        // Exibe o modal customizado que você já possui no seu app.js!
        alert("Erro ao gerar o documento de DJO: " + err.message); 
    }
}
