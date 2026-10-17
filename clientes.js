/**
 * MÓDULO EXCLUSIVO: CLIENTES NF & PRIVACIDADE DE VALORES (COM SENHA)
 */

// Estado interno do módulo de clientes
const clientesState = {
    rawClientes: [],
    filteredClientes: [],
    hideValues: true, // Habilitado por padrão (desfocado ao iniciar)
    currentPage: 1,
    pageSize: 100
};

// Termos para identificação automática do arquivo de clientes na pasta
const CLIENTES_FILE_KEYWORDS = ['cliente', 'clientes', 'cnpj', 'cpf'];

document.addEventListener('DOMContentLoaded', () => {
    initClientesModule();
});

/**
 * Inicializa os eventos, estado visual e leituras da aba Clientes
 */
function initClientesModule() {
    // Aplica o desfoque inicial no carregamento da aplicação
    document.body.classList.add('hide-values');
    const btnToggleValues = document.getElementById('btnToggleValues');
    if (btnToggleValues) {
        btnToggleValues.innerHTML = '🙈';
        btnToggleValues.title = 'Exibir Valores Financeiros';
        btnToggleValues.classList.add('active-hide');
        btnToggleValues.addEventListener('click', toggleValuesVisibility);
    }

    // Monitora a troca de abas para ajustar visibilidade de controles globais
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            const isClientesTab = targetTab === 'tab-clientes';

            const globalControls = document.getElementById('globalControlsSection');
            const sharedPaginationBar = document.getElementById('sharedPaginationBar');

            if (isClientesTab) {
                if (globalControls) globalControls.style.display = 'none';
                if (sharedPaginationBar) sharedPaginationBar.style.display = 'none';
                renderClientesUI();
            }
        });
    });

    // Monitora a seleção da pasta de relatórios
    const folderInput = document.getElementById('folderInput');
    if (folderInput) {
        folderInput.addEventListener('change', handleClientesFolderSelect);
    }

    // Evento de busca em tempo real (CNPJ/CPF ou Razão Social)
    const searchClientes = document.getElementById('searchClientes');
    if (searchClientes) {
        searchClientes.addEventListener('input', () => {
            clientesState.currentPage = 1;
            applyClientesFilter();
        });
    }

    // Botão de limpar busca na janela de clientes
    const btnClearSearchClientes = document.getElementById('btnClearSearchClientes');
    if (btnClearSearchClientes) {
        btnClearSearchClientes.addEventListener('click', () => {
            const searchInput = document.getElementById('searchClientes');
            if (searchInput) {
                searchInput.value = '';
                clientesState.currentPage = 1;
                applyClientesFilter();
            }
        });
    }
}

/**
 * Copia o CNPJ/CPF para a área de transferência com confirmação visual rápida
 */
function copyCnpjToClipboard(cnpj, el) {
    if (!cnpj || cnpj === '-') return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cnpj).then(() => {
            const originalHTML = el.innerHTML;
            el.innerHTML = `${cnpj} <span style="color: var(--status-success); font-size: 0.65rem; margin-left: 4px;">✔ Copiado!</span>`;
            setTimeout(() => {
                el.innerHTML = originalHTML;
            }, 1500);
        }).catch(err => console.error('Erro ao copiar CNPJ:', err));
    }
}

/**
 * Alterna a visibilidade dos valores financeiros exigindo a senha 'atcatc'
 */
function toggleValuesVisibility() {
    if (clientesState.hideValues) {
        const senha = prompt("Digite a senha para exibir os valores financeiros:");
        if (senha !== "atcatc") {
            alert("Senha incorreta!");
            return;
        }
    }

    clientesState.hideValues = !clientesState.hideValues;
    const body = document.body;
    const btn = document.getElementById('btnToggleValues');

    if (clientesState.hideValues) {
        body.classList.add('hide-values');
        if (btn) {
            btn.innerHTML = '🙈';
            btn.title = 'Exibir Valores Financeiros';
            btn.classList.add('active-hide');
        }
    } else {
        body.classList.remove('hide-values');
        if (btn) {
            btn.innerHTML = '👁️';
            btn.title = 'Ocultar Valores Financeiros';
            btn.classList.remove('active-hide');
        }
    }
}

/**
 * Processa a seleção da pasta procurando pela planilha de clientes
 */
async function handleClientesFolderSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const clienteFile = files.find(file => {
        const nameLower = file.name.toLowerCase();
        return CLIENTES_FILE_KEYWORDS.some(key => nameLower.includes(key));
    });

    if (!clienteFile) {
        console.warn("Nenhuma planilha de clientes encontrada na pasta.");
        return;
    }

    try {
        const rawJson = await parseFileToJSONClientes(clienteFile);
        clientesState.rawClientes = processClientesData(rawJson);
        clientesState.filteredClientes = [...clientesState.rawClientes];
        
        renderClientesUI();
    } catch (err) {
        console.error("Erro ao ler arquivo de clientes:", err);
    }
}

/**
 * Converte o arquivo Excel/CSV de clientes em objeto JSON
 */
function parseFileToJSONClientes(file) {
    return new Promise((resolve, reject) => {
        const isCsv = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt');
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let workbook;
                if (isCsv) {
                    const text = e.target.result;
                    workbook = XLSX.read(text, { type: 'string', raw: true });
                } else {
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array', raw: true });
                }
                
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                resolve(json);
            } catch (err) { reject(err); }
        };

        reader.onerror = reject;

        if (isCsv) {
            reader.readAsText(file, 'ISO-8859-1');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

/**
 * Normaliza e padroniza a estrutura dos dados dos clientes
 */
function processClientesData(jsonArray) {
    return jsonArray.map((row, idx) => {
        const rawCnpj = row['CNPJ/CPF'] || row['CNPJ / CPF'] || row['CPF_CNPJ'] 
                     || row['CPF/CNPJ'] || row['CNPJ'] || row['CPF'] || row['CNPJ_CPF'] 
                     || row['CGC'] || row['DOCUMENTO'] || '-';

        const razaoSocial = row['RAZAO SOCIAL'] || row['RAZÃO SOCIAL'] || row['RAZAO_SOCIAL'] 
                         || row['NOME'] || row['CLIENTE'] || 'Não Informado';

        const endereco = row['ENDERECO'] || row['ENDEREÇO'] || row['LOGRADOURO'] || row['RUA'] || '-';
        const bairro = row['BAIRRO'] || '-';
        const cidade = row['CIDADE'] || row['MUNICIPIO'] || '-';
        const estado = row['ESTADO'] || row['UF'] || row['SG_UF'] || '-';
        const cep = row['CEP'] || '-';
        const email = row['E-MAIL'] || row['EMAIL'] || row['E_MAIL'] || '-';
        const telefone = row['TELEFONE'] || row['TEL'] || row['CELULAR'] || row['FONE'] || '-';

        return {
            id: idx,
            cnpjCpf: String(rawCnpj).trim(),
            razaoSocial: String(razaoSocial).trim(),
            endereco: String(endereco).trim(),
            bairro: String(bairro).trim(),
            cidade: String(cidade).trim(),
            estado: String(estado).trim().toUpperCase(),
            cep: String(cep).trim(),
            email: String(email).trim().toLowerCase(),
            telefone: String(telefone).trim()
        };
    });
}

/**
 * Filtro avançado com suporte a busca por Razão Social e CNPJ
 */
function applyClientesFilter() {
    const searchInput = document.getElementById('searchClientes');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cleanSearchDigits = searchTerm.replace(/\D/g, '');
    
    const searchTokens = searchTerm.split(/\s+/).filter(t => t.length > 0);

    if (!searchTerm) {
        clientesState.filteredClientes = [...clientesState.rawClientes];
    } else {
        clientesState.filteredClientes = clientesState.rawClientes.filter(c => {
            const cleanCnpjDigits = c.cnpjCpf.replace(/\D/g, '');
            const matchDigits = cleanSearchDigits.length > 0 && cleanCnpjDigits.includes(cleanSearchDigits);
            const matchCnpjDirect = c.cnpjCpf.toLowerCase().includes(searchTerm);
            
            const razaoLower = c.razaoSocial.toLowerCase();
            const matchRazao = searchTokens.every(token => razaoLower.includes(token));

            return matchDigits || matchCnpjDirect || matchRazao;
        });
    }

    renderClientesUI();
}

/**
 * Renderiza a Tabela e os KPIs da aba Clientes NF
 */
function renderClientesUI() {
    const tableBody = document.getElementById('clientesTableBody');
    const kpiTotal = document.getElementById('kpiTotalClientes');
    const kpiFiltrados = document.getElementById('kpiClientesFiltrados');

    if (kpiTotal) kpiTotal.textContent = clientesState.rawClientes.length.toLocaleString('pt-BR');
    if (kpiFiltrados) kpiFiltrados.textContent = clientesState.filteredClientes.length.toLocaleString('pt-BR');

    if (!tableBody) return;

    if (clientesState.filteredClientes.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="empty-state">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    tableBody.innerHTML = clientesState.filteredClientes.map(c => `
        <tr>
            <td>
                <strong class="cnpj-click" onclick="copyCnpjToClipboard('${c.cnpjCpf}', this)" title="Clique para copiar o CNPJ/CPF" style="cursor: pointer; color: var(--accent-blue);">
                    ${c.cnpjCpf}
                </strong>
            </td>
            <td><strong>${c.razaoSocial}</strong></td>
            <td>${c.endereco}</td>
            <td>${c.bairro}</td>
            <td>${c.cidade}</td>
            <td><span class="badge badge-normal">${c.estado}</span></td>
            <td>${c.cep}</td>
            <td>${c.email}</td>
            <td>${c.telefone}</td>
        </tr>
    `).join('');
}