<div id="consulta-NCM" class="tela-cadastro-final sub-pagina" style="display: none;">
    <button class="btn-voltar" onclick="voltarAoPainelDJONCM()">
        <i class="fa-solid fa-arrow-left"></i> Voltar para DJO/NCM
    </button>
    
    <div class="cartao-cadastro" style="border-left: 4px solid #3b82f6; margin-bottom: 24px;">
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 12px;">
            <i class="fa-solid fa-circle-info" style="color: #3b82f6;"></i> Informações de Atualização do Banco
        </h3>
        <div style="font-size: 14px; color: #64748b; line-height: 1.6;">
            <p><strong>Normativa Vigente:</strong> Instrução Normativa RFB nº 2.123/2023</p>
            <p><strong>Data da Normativa:</strong> 15/12/2023</p>
            <p><strong>Sincronizado em:</strong> 21/06/2026</p>
        </div>
    </div>

    <div class="cartao-cadastro">
        <h2><i class="fa-solid fa-magnifying-glass"></i> Consultar Código NCM</h2>
        <p style="color: #64748b; margin-bottom: 20px; font-size: 14px;">Insira o código numérico para buscar a descrição oficial no banco de dados aduaneiro.</p>
        
        <div class="form-grupo">
            <label for="pesquisa-ncm-input">Código do NCM</label>
            <input type="text" 
                   id="pesquisa-ncm-input" 
                   class="input-moderno" 
                   placeholder="0000.00.00" 
                   maxlength="10" 
                   autocomplete="off"
                   style="font-size: 16px; font-weight: 600; letter-spacing: 1px; margin-bottom: 15px;">
        </div>

        <div class="botoes-container" style="margin-top: 10px; margin-bottom: 20px;">
            <button type="button" id="btn-pesquisar-ncm" class="btn-acao btn-salvar">
                <i class="fa-solid fa-magnifying-glass"></i> Pesquisar NCM
            </button>
        </div>

        <div id="status-pesquisa-ncm" style="display: none; padding: 15px; border-radius: 8px; text-align: center; font-size: 14px; margin-bottom: 20px; font-weight: 500;"></div>

        <div id="resultado-ncm-container" style="display: none; margin-top: 10px;">
            <h3 style="font-size: 16px; margin-bottom: 15px; color: #1e293b;"><i class="fa-solid fa-list-check"></i> Resultado Encontrado:</h3>
            <div class="tabela-container">
                <table class="tabela-moderna">
                    <thead>
                        <tr>
                            <th style="width: 180px;">Código NCM</th>
                            <th>Descrição da Mercadoria</th>
                        </tr>
                    </thead>
                    <tbody id="tabela-resultado-ncm-body">
                        </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
