/**
 * MÓDULO EXCLUSIVO: JANELA DE PEDIDOS
 */

const pedidosState = {
    rawSmg13: [],
    filteredSmg13: [],
    cartItems: [], 
    savedOrders: {}, // Armazena os pedidos de cada cliente em memória
    clientName: '',
    activeModalProduct: null,
    currentPage: 1,
    pageSize: 100
};

// Termos para identificação automática da planilha SMG13
const SMG13_KEYWORDS = ['smg13', 'biblia'];

document.addEventListener('DOMContentLoaded', () => {
    initPedidosModule();
});

/**
 * Inicializa os eventos da aba Pedidos
 */
function initPedidosModule() {
    // Monitora a seleção da pasta
    const folderInput = document.getElementById('folderInput');
    if (folderInput) {
        folderInput.addEventListener('change', handlePedidosFolderSelect);
    }
	
	// Botão Exportar Tudo (PDF Multi-páginas de Todos os Pedidos)
    const btnExportarTudo = document.getElementById('btnExportarTudoPedido');
    if (btnExportarTudo) {
        btnExportarTudo.addEventListener('click', exportarTodosPedidosPdf);
    }

    // Campo de Nome do Cliente com menu SELECT escuro
    const selectCliente = document.getElementById('pedidosClienteSelect');
    const btnNovoCliente = document.getElementById('btnNovoCliente');

    if (selectCliente) {
        selectCliente.addEventListener('change', (e) => {
            const novoNome = e.target.value.trim();
            const nomeAntigo = pedidosState.clientName.trim();

            if (nomeAntigo !== '') {
                if (pedidosState.cartItems.length > 0) {
                    pedidosState.savedOrders[nomeAntigo] = [...pedidosState.cartItems];
                } else {
                    delete pedidosState.savedOrders[nomeAntigo];
                }
            }

            pedidosState.clientName = novoNome;

            if (novoNome !== '' && pedidosState.savedOrders[novoNome]) {
                pedidosState.cartItems = [...pedidosState.savedOrders[novoNome]];
            } else {
                pedidosState.cartItems = [];
            }

            updateClientesSelect();
            renderPedidosKpis();
            renderPedidosCartTable();
        });
    }

    if (btnNovoCliente) {
        btnNovoCliente.addEventListener('click', () => {
            const nomePrompt = prompt("Digite o nome do novo cliente:");
            if (nomePrompt && nomePrompt.trim() !== '') {
                const nomeFormatado = nomePrompt.trim();
                
                // Salva o pedido atual antes de mudar para o novo
                const nomeAntigo = pedidosState.clientName.trim();
                if (nomeAntigo !== '' && pedidosState.cartItems.length > 0) {
                    pedidosState.savedOrders[nomeAntigo] = [...pedidosState.cartItems];
                }

                pedidosState.savedOrders[nomeFormatado] = [];
                pedidosState.clientName = nomeFormatado;
                pedidosState.cartItems = [];
                
                updateClientesSelect();
                if (selectCliente) selectCliente.value = nomeFormatado;
                
                renderPedidosKpis();
                renderPedidosCartTable();
            }
        });
    }

    // Botão Gerar Imagem do Pedido
    const btnGerarImagem = document.getElementById('btnGerarImagemPedido');
    if (btnGerarImagem) {
        btnGerarImagem.addEventListener('click', exportarPedidoParaImagem);
    }

    // Botão Imprimir Pedido
    const btnImprimir = document.getElementById('btnImprimirPedido');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirPedido);
    }

    // Monitora a troca de abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            const isPedidosTab = targetTab === 'tab-pedidos';

            const globalControls = document.getElementById('globalControlsSection');
            const sharedPaginationBar = document.getElementById('sharedPaginationBar');

            if (isPedidosTab) {
                if (globalControls) globalControls.style.display = 'none';
                if (sharedPaginationBar) sharedPaginationBar.style.display = 'none';
                renderPedidosUI();
            }
        });
    });

    // Filtros de busca no catálogo SMG13 (Descrição, Embalagem e Toggle Estoque)
    const searchInput = document.getElementById('searchPedidosCatalog');
    const searchEmbInput = document.getElementById('searchPedidosEmbalagem');
    const toggleEstoque = document.getElementById('togglePedidosEstoque');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            pedidosState.currentPage = 1;
            applyPedidosCatalogFilter();
        });
    }

    if (searchEmbInput) {
        searchEmbInput.addEventListener('input', () => {
            pedidosState.currentPage = 1;
            applyPedidosCatalogFilter();
        });
    }

    if (toggleEstoque) {
        toggleEstoque.addEventListener('change', () => {
            pedidosState.currentPage = 1;
            applyPedidosCatalogFilter();
        });
    }

    const btnClearSearch = document.getElementById('btnClearSearchPedidos');
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (searchEmbInput) searchEmbInput.value = '';
            if (toggleEstoque) toggleEstoque.checked = false;
            pedidosState.currentPage = 1;
            applyPedidosCatalogFilter();
        });
    }

    // Controles de Paginação do Catálogo
    const btnPrev = document.getElementById('btnPedidosPrevPage');
    const btnNext = document.getElementById('btnPedidosNextPage');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (pedidosState.currentPage > 1) {
                pedidosState.currentPage--;
                renderPedidosCatalogTable();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const total = pedidosState.filteredSmg13.length;
            const maxPages = Math.ceil(total / pedidosState.pageSize) || 1;
            if (pedidosState.currentPage < maxPages) {
                pedidosState.currentPage++;
                renderPedidosCatalogTable();
            }
        });
    }

    // Eventos da Janela Flutuante (Modal)
    initModalEvents();
}

/**
 * Eventos da Janela Flutuante (Modal) de Lançamento / Edição
 */
function initModalEvents() {
    const btnClose = document.getElementById('btnCloseLancarModal');
    const btnCancel = document.getElementById('btnCancelLancarModal');
    const btnConfirm = document.getElementById('btnConfirmLancarModal');
    const inputQtd = document.getElementById('inputModalQtd');
    const inputPrecoUnd = document.getElementById('inputModalPrecoNegociado');

    if (btnClose) btnClose.addEventListener('click', closeLancarModal);
    if (btnCancel) btnCancel.addEventListener('click', closeLancarModal);
    if (btnConfirm) btnConfirm.addEventListener('click', confirmLancarModal);

    if (inputQtd) {
        inputQtd.addEventListener('input', updateModalSubtotal);
        inputQtd.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmLancarModal();
        });
    }

    if (inputPrecoUnd) {
        inputPrecoUnd.addEventListener('input', updateModalSubtotal);
        inputPrecoUnd.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmLancarModal();
        });
    }

    // Fechar modal ao pressionar ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalLancarProduto');
            if (modal && !modal.classList.contains('hidden')) {
                closeLancarModal();
            }
        }
    });
}

/**
 * Formata o código no padrão SMG13 ("XXXXX-XXX", ex: "00071-962")
 */
function formatCodeSMG13(raw) {
    if (raw === null || raw === undefined || raw === '') return '-';
    let str = String(raw).trim();
    let digits = str.replace(/\D/g, '');
    if (!digits) return str;

    if (digits.length <= 8) {
        let padded = digits.padStart(8, '0');
        return `${padded.slice(0, 5)}-${padded.slice(5)}`;
    } else {
        return `${digits.slice(0, -3)}-${digits.slice(-3)}`;
    }
}

/**
 * Formata o Código de Barras no padrão "*xxxxxxxx*" (sem hífen e sem zeros à esquerda)
 */
function formatBarcodeCode39(raw) {
    if (raw === null || raw === undefined || raw === '') return '**';
    let str = String(raw).trim().replace(/-/g, '');
    let cleanDigits = str.replace(/^0+/, '');
    if (!cleanDigits) cleanDigits = '0';
    return `*${cleanDigits}*`;
}

/**
 * Converte valor textual/numérico em JS Number
 */
function parseNumberPedidos(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = String(val).trim();
    if (str.includes(',') && !str.includes('.')) {
        str = str.replace(',', '.');
    } else if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

/**
 * Extrai fator de embalagem para calcular Preço Und
 */
function extractPackingFactorPedidos(embStr) {
    if (!embStr) return 1;
    const s = String(embStr).toUpperCase().trim();
    
    let multMatch = s.match(/(\d+)\s*X\s*(\d+)/);
    if (multMatch && multMatch[1] && multMatch[2]) {
        let f1 = parseInt(multMatch[1], 10);
        let f2 = parseInt(multMatch[2], 10);
        if (f1 > 0 && f2 > 0) return f1 * f2;
    }

    let m = s.match(/1\s*X\s*(\d+)/);
    if (m && m[1]) {
        let val = parseInt(m[1], 10);
        if (val > 0) return val;
    }

    m = s.match(/(?:\bX|\b\*)\s*(\d+)/);
    if (m && m[1]) {
        let val = parseInt(m[1], 10);
        if (val > 0) return val;
    }

    m = s.match(/C\/\s*(\d+)/);
    if (m && m[1]) {
        let val = parseInt(m[1], 10);
        if (val > 0) return val;
    }

    return 1;
}

/**
 * Trata a seleção da pasta procurando pela planilha SMG13
 */
async function handlePedidosFolderSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const smg13File = files.find(file => {
        const nameLower = file.name.toLowerCase();
        return SMG13_KEYWORDS.some(key => nameLower.includes(key));
    });

    if (!smg13File) return;

    try {
        const rawJson = await parseFileToJSONPedidos(smg13File);
        pedidosState.rawSmg13 = processSmg13Data(rawJson);
        pedidosState.filteredSmg13 = [...pedidosState.rawSmg13];
        pedidosState.currentPage = 1;

        renderPedidosUI();
    } catch (err) {
        console.error("Erro ao ler arquivo SMG13 na aba Pedidos:", err);
    }
}

/**
 * Converte arquivo Excel/CSV em JSON
 */
function parseFileToJSONPedidos(file) {
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

                const headersMap = {};
                if (worksheet['!ref']) {
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellRef = XLSX.utils.encode_cell({ c: C, r: range.s.r });
                        const colLetter = cellRef.replace(/[0-9]/g, '');
                        if (worksheet[cellRef] && worksheet[cellRef].v) {
                            headersMap[colLetter] = worksheet[cellRef].v;
                        }
                    }
                }
                json.__headersMap = headersMap;

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
 * Processa e padroniza a SMG13 com a coluna Paletização
 */
function processSmg13Data(jsonArray) {
    const headerM13 = jsonArray.__headersMap ? jsonArray.__headersMap['M'] : null;

    return jsonArray.map((row, idx) => {
        const rawCode = row['Código'] || row['MERC'] || row['MERCADORIA'] || row['MERCADC'] || row['CODIGO'] || '';
        const formattedCode = formatCodeSMG13(rawCode);

        const descricao = row['Descrição Mercadoria'] || row['DESCRICAO'] || row['DESCRICA'] || row['PRODUTO'] || 'Produto Sem Descrição';
        const embalagem = row['Embalagem'] || row['EMBALAGEM'] || '-';

        const estoqEmb1 = parseNumberPedidos(row['Estoque Emb1'] || row['ESTOQ EMB1'] || row['Estoque'] || 0);
        const estoqEmb9 = parseNumberPedidos(row['Estoque Emb9'] || row['ESTOQ EMB9'] || 0);

        const precoCx = parseNumberPedidos(row['Vendas Preço'] || row['Preço Ind.'] || row['PRECO VENDA'] || row['Preço'] || row['Preço Venda'] || 0);

        const packingFactor = extractPackingFactorPedidos(embalagem);
        const precoUnd = packingFactor > 0 ? (precoCx / packingFactor) : precoCx;

        let paletizacaoVal = 0;
        if (headerM13 && row[headerM13] !== undefined && row[headerM13] !== "") {
            paletizacaoVal = parseNumberPedidos(row[headerM13]);
        } else {
            paletizacaoVal = parseNumberPedidos(
                row['QTDE IDEAL'] || row['Qtde Ideal'] || row['Qtd Ideal'] || 
                row['QUANTIDADE IDEAL'] || row['Paletização'] || row['PALETIZACAO'] || 0
            );
        }

        return {
            id: idx,
            rawCode: String(rawCode).trim(),
            formattedCode: formattedCode,
            descricao: String(descricao).trim(),
            embalagem: String(embalagem).trim(),
            estoqEmb1: estoqEmb1,
            estoqEmb9: estoqEmb9,
            precoCx: precoCx,
            precoUnd: precoUnd,
            paletizacao: paletizacaoVal,
            packingFactor: packingFactor
        };
    });
}

/**
 * Filtro de busca combinado (Código/Descrição + Embalagem + Somente Estoque)
 */
function applyPedidosCatalogFilter() {
    const searchInput = document.getElementById('searchPedidosCatalog');
    const searchEmbInput = document.getElementById('searchPedidosEmbalagem');
    const toggleEstoque = document.getElementById('togglePedidosEstoque');

    const termText = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const termEmb = searchEmbInput ? searchEmbInput.value.toLowerCase().trim() : '';
    const filterEstoque = toggleEstoque ? toggleEstoque.checked : false;

    const tokensText = termText.split(/\s+/).filter(t => t.length > 0);

    if (tokensText.length === 0 && !termEmb && !filterEstoque) {
        pedidosState.filteredSmg13 = [...pedidosState.rawSmg13];
    } else {
        pedidosState.filteredSmg13 = pedidosState.rawSmg13.filter(item => {
            const textToSearch = `${item.rawCode} ${item.formattedCode} ${item.descricao}`.toLowerCase();
            const embToSearch = item.embalagem.toLowerCase();
            
            const hasEstoque = (item.estoqEmb1 > 0 || item.estoqEmb9 > 0);
            const matchesEstoque = filterEstoque ? hasEstoque : true;

            const matchesText = tokensText.every(token => textToSearch.includes(token));
            const matchesEmb = !termEmb || embToSearch.includes(termEmb);

            return matchesText && matchesEmb && matchesEstoque;
        });
    }

    renderPedidosCatalogTable();
}

/**
 * Renderiza a interface inteira da aba Pedidos
 */
function renderPedidosUI() {
    renderPedidosKpis();
    renderPedidosCatalogTable();
    renderPedidosCartTable();
}

/**
 * Atualiza os KPIs de Valor e Quantidade de Produtos no Pedido
 */
function renderPedidosKpis() {
    const kpiValor = document.getElementById('kpiValorPedido');
    const kpiQtd = document.getElementById('kpiQtdItensPedido');

    const totalValor = pedidosState.cartItems.reduce((sum, item) => sum + (item.qtdCx * item.precoCxNegociado), 0);
    const totalQtdProdutos = pedidosState.cartItems.length;

    if (kpiValor) kpiValor.textContent = totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (kpiQtd) kpiQtd.textContent = totalQtdProdutos.toLocaleString('pt-BR');
}

/**
 * Renderiza a Tabela da Esquerda (Catálogo SMG13 com Paletização)
 */
function renderPedidosCatalogTable() {
    const tableBody = document.getElementById('pedidosCatalogTableBody');
    const pageInfo = document.getElementById('pedidosPageInfo');
    const pageNum = document.getElementById('pedidosCurrentPageNum');
    const btnPrev = document.getElementById('btnPedidosPrevPage');
    const btnNext = document.getElementById('btnPedidosNextPage');

    if (!tableBody) return;

    const total = pedidosState.filteredSmg13.length;
    if (total === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum produto encontrado na SMG13.</td></tr>`;
        if (pageInfo) pageInfo.textContent = `Exibindo 0 de 0 produtos`;
        if (pageNum) pageNum.textContent = `Pág 1 / 1`;
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        return;
    }

    const maxPages = Math.ceil(total / pedidosState.pageSize) || 1;
    if (pedidosState.currentPage > maxPages) pedidosState.currentPage = maxPages;

    const startIdx = (pedidosState.currentPage - 1) * pedidosState.pageSize;
    const endIdx = Math.min(startIdx + pedidosState.pageSize, total);
    const pageItems = pedidosState.filteredSmg13.slice(startIdx, endIdx);

    if (pageInfo) pageInfo.textContent = `Exibindo ${startIdx + 1} até ${endIdx} de ${total.toLocaleString('pt-BR')} produtos`;
    if (pageNum) pageNum.textContent = `Pág ${pedidosState.currentPage} / ${maxPages}`;
    if (btnPrev) btnPrev.disabled = pedidosState.currentPage <= 1;
    if (btnNext) btnNext.disabled = pedidosState.currentPage >= maxPages;

    tableBody.innerHTML = pageItems.map(item => {
        let txtEstoque = `${item.estoqEmb1.toLocaleString('pt-BR')} CX`;
        if (item.estoqEmb9 > 0) {
            txtEstoque += ` | ${item.estoqEmb9.toLocaleString('pt-BR')} UN`;
        }

        const txtPaletizacao = item.paletizacao > 0 ? `${item.paletizacao.toLocaleString('pt-BR')} CX` : '-';

        return `
        <tr style="cursor: pointer;" onclick="openLancarModal(${item.id})" title="Clique para abrir a janela de lançamento do produto">
            <td><strong style="color: var(--accent-blue);">${item.formattedCode}</strong></td>
            <td><strong>${item.descricao}</strong></td>
            <td>${item.embalagem}</td>
            <td>${txtEstoque}</td>
            <td>${item.precoCx.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${item.precoUnd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td><strong>${txtPaletizacao}</strong></td>
        </tr>
        `;
    }).join('');
}

/**
 * Abre a Janela Flutuante (Modal) para lançar ou editar um produto
 */
function openLancarModal(productId) {
    const product = pedidosState.rawSmg13.find(p => p.id === productId);
    if (!product) return;

    pedidosState.activeModalProduct = product;

    const existingCartItem = pedidosState.cartItems.find(ci => ci.id === productId);

    const modal = document.getElementById('modalLancarProduto');
    const elCode = document.getElementById('modalProdCode');
    const elDesc = document.getElementById('modalProdDesc');
    const elEmb = document.getElementById('modalProdEmb');
    const elEstoque = document.getElementById('modalProdEstoque');
    const elPaletizacao = document.getElementById('modalProdPaletizacao');
    const elPrecoUndTabela = document.getElementById('modalProdPrecoUndTabela');
    const inputQtd = document.getElementById('inputModalQtd');
    const inputPrecoUnd = document.getElementById('inputModalPrecoNegociado');

    if (!modal) return;

    if (elCode) elCode.textContent = product.formattedCode;
    if (elDesc) elDesc.textContent = product.descricao;
    if (elEmb) elEmb.textContent = product.embalagem;
    
    let txtEstoque = `${product.estoqEmb1.toLocaleString('pt-BR')} CX`;
    if (product.estoqEmb9 > 0) txtEstoque += ` | ${product.estoqEmb9.toLocaleString('pt-BR')} UN`;
    if (elEstoque) elEstoque.textContent = txtEstoque;

    if (elPaletizacao) elPaletizacao.textContent = product.paletizacao > 0 ? `${product.paletizacao.toLocaleString('pt-BR')} CX` : '-';
    if (elPrecoUndTabela) elPrecoUndTabela.textContent = product.precoUnd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (existingCartItem) {
        if (inputQtd) inputQtd.value = existingCartItem.qtdCx;
        if (inputPrecoUnd) inputPrecoUnd.value = existingCartItem.precoUndNegociado.toFixed(2);
    } else {
        if (inputQtd) inputQtd.value = 1;
        if (inputPrecoUnd) inputPrecoUnd.value = product.precoUnd.toFixed(2);
    }

    updateModalSubtotal();

    modal.classList.remove('hidden');

    setTimeout(() => {
        if (inputQtd) {
            inputQtd.focus();
            inputQtd.select();
        }
    }, 50);
}

/**
 * Recalcula o Subtotal e Preço Caixa ao vivo na Modal
 */
function updateModalSubtotal() {
    const product = pedidosState.activeModalProduct;
    if (!product) return;

    const inputQtd = document.getElementById('inputModalQtd');
    const inputPrecoUnd = document.getElementById('inputModalPrecoNegociado');
    const elPrecoCxCalc = document.getElementById('modalProdPrecoCxCalc');
    const elSubtotal = document.getElementById('modalProdSubtotal');

    const qtd = parseNumberPedidos(inputQtd ? inputQtd.value : 0);
    const precoUnd = parseNumberPedidos(inputPrecoUnd ? inputPrecoUnd.value : 0);
    const fator = product.packingFactor || 1;

    const precoCxCalculado = precoUnd * fator;
    const subtotal = qtd * precoCxCalculado;

    if (elPrecoCxCalc) {
        elPrecoCxCalc.textContent = precoCxCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (elSubtotal) {
        elSubtotal.textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

/**
 * Confirma o lançamento do item no pedido e fecha a modal
 */
function confirmLancarModal() {
    const product = pedidosState.activeModalProduct;
    if (!product) return;

    const inputQtd = document.getElementById('inputModalQtd');
    const inputPrecoUnd = document.getElementById('inputModalPrecoNegociado');

    const qtd = parseNumberPedidos(inputQtd ? inputQtd.value : 0);
    const precoUndNegociado = parseNumberPedidos(inputPrecoUnd ? inputPrecoUnd.value : 0);
    const fator = product.packingFactor || 1;
    const precoCxNegociado = precoUndNegociado * fator;

    if (qtd <= 0) {
        alert("Por favor, digite uma quantidade maior que zero.");
        return;
    }

    const existingIndex = pedidosState.cartItems.findIndex(ci => ci.id === product.id);

    if (existingIndex >= 0) {
        pedidosState.cartItems[existingIndex].qtdCx = qtd;
        pedidosState.cartItems[existingIndex].precoUndNegociado = precoUndNegociado;
        pedidosState.cartItems[existingIndex].precoCxNegociado = precoCxNegociado;
    } else {
        pedidosState.cartItems.push({
            id: product.id,
            rawCode: product.rawCode,
            formattedCode: product.formattedCode,
            descricao: product.descricao,
            embalagem: product.embalagem,
            precoUndTabela: product.precoUnd,
            precoUndNegociado: precoUndNegociado,
            precoCxNegociado: precoCxNegociado,
            packingFactor: fator,
            qtdCx: qtd,
            paletizacao: product.paletizacao
        });
    }

    closeLancarModal();
    renderPedidosKpis();
    renderPedidosCartTable();
}

/**
 * Fecha a modal flutuante
 */
function closeLancarModal() {
    const modal = document.getElementById('modalLancarProduto');
    if (modal) modal.classList.add('hidden');
    pedidosState.activeModalProduct = null;
}

/**
 * Remove um item do pedido
 */
function removeItemFromOrder(itemId) {
    pedidosState.cartItems = pedidosState.cartItems.filter(ci => ci.id !== itemId);
    renderPedidosKpis();
    renderPedidosCartTable();
}

/**
 * Renderiza a Tabela da Direita (Itens do Pedido)
 */
function renderPedidosCartTable() {
    const tableBody = document.getElementById('pedidosCartTableBody');
    if (!tableBody) return;

    if (pedidosState.cartItems.length === 0) {
        tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                Nenhum item adicionado ao pedido ainda.<br>
                <span class="sub-text" style="margin-top: 4px;">Clique nos produtos da tabela da esquerda para abrir a janela de lançamento.</span>
            </td>
        </tr>`;
        return;
    }

    tableBody.innerHTML = pedidosState.cartItems.map(item => {
        const subtotal = item.qtdCx * item.precoCxNegociado;

        const precoCxFormatted = item.precoCxNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const precoUndFormatted = item.precoUndNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const barcodeText = formatBarcodeCode39(item.rawCode || item.formattedCode);

        return `
        <tr>
            <td><strong style="color: var(--accent-blue);">${item.formattedCode}</strong></td>
            <td><strong>${item.descricao}</strong></td>
            <td style="text-align: center;"><strong>${item.qtdCx} CX</strong></td>
            <td style="text-align: right;">
                ${precoCxFormatted}
                <span class="sub-text">Und: ${precoUndFormatted}</span>
            </td>
            <td style="text-align: right;"><strong style="color: #4ade80;">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
            <td style="text-align: center;"><span class="barcode-font">${barcodeText}</span></td>
            <td style="text-align: center;">
                <button class="btn-action-cart" onclick="openLancarModal(${item.id})" title="Editar quantidade ou preço">✏️</button>
                <button class="btn-action-cart btn-remove-item" onclick="removeItemFromOrder(${item.id})" title="Remover do pedido">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * Gera a imagem do pedido com cliente, totais e tabela sem a coluna de ações
 * e copia a imagem diretamente para a área de transferência do usuário.
 */
async function exportarPedidoParaImagem() {
    if (pedidosState.cartItems.length === 0) {
        alert("Adicione pelo menos um item ao pedido para gerar a imagem.");
        return;
    }

    const btn = document.getElementById('btnGerarImagemPedido');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '⏳ Gerando...';
        btn.disabled = true;
    }

    try {
        const clienteNome = pedidosState.clientName.trim() || 'Não Informado';
        const totalValor = pedidosState.cartItems.reduce((sum, item) => sum + (item.qtdCx * item.precoCxNegociado), 0);
        const totalItens = pedidosState.cartItems.length;

        let renderContainer = document.getElementById('pedidoRenderExportContainer');
        if (!renderContainer) {
            renderContainer = document.createElement('div');
            renderContainer.id = 'pedidoRenderExportContainer';
            document.body.appendChild(renderContainer);
        }

        const rowsHtml = pedidosState.cartItems.map(item => {
            const subtotal = item.qtdCx * item.precoCxNegociado;
            const precoCxFormatted = item.precoCxNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const precoUndFormatted = item.precoUndNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const barcodeText = formatBarcodeCode39(item.rawCode || item.formattedCode);

            return `
            <tr>
                <td style="color: #38bdf8; font-weight: bold;">${item.formattedCode}</td>
                <td style="font-weight: bold;">${item.descricao}</td>
                <td style="text-align: center; font-weight: bold;">${item.qtdCx} CX</td>
                <td style="text-align: right;">
                    ${precoCxFormatted}
                    <div style="font-size: 9px; color: #94a3b8;">Und: ${precoUndFormatted}</div>
                </td>
                <td style="text-align: right; color: #4ade80; font-weight: bold;">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td style="text-align: center;"><span class="barcode-font">${barcodeText}</span></td>
            </tr>
            `;
        }).join('');

        renderContainer.innerHTML = `
            <div class="export-header">
                <div class="export-title">📦 StockAnalytics - Espelho de Pedido</div>
                <div class="export-meta">
                    <div>👤 <strong>CLIENTE:</strong> ${clienteNome}</div>
                    <div>📦 <strong>ITENS:</strong> ${totalItens}</div>
                    <div>💰 <strong>VALOR TOTAL:</strong> <span style="color: #4ade80; font-weight: bold;">${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Código</th>
                        <th style="width: 30%;">Descrição</th>
                        <th style="width: 10%; text-align: center;">Qtd. CX</th>
                        <th style="width: 15%; text-align: right;">PreçoCX</th>
                        <th style="width: 15%; text-align: right;">Subtotal</th>
                        <th style="width: 15%; text-align: center;">C. Barras</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        if (typeof html2canvas === 'undefined') {
            alert('A biblioteca de geração de imagem não foi encontrada no projeto.');
            return;
        }

        const canvas = await html2canvas(renderContainer, {
            scale: 2,
            backgroundColor: '#0b1120',
            useCORS: true
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                alert("Erro ao gerar o arquivo de imagem.");
                return;
            }

            try {
                if (navigator.clipboard && window.ClipboardItem) {
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    alert("✔ Imagem do pedido copiada para a área de transferência com sucesso!");
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Pedido_${clienteNome.replace(/\s+/g, '_')}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                    alert("A imagem do pedido foi baixada para a sua máquina.");
                }
            } catch (err) {
                console.error("Erro ao copiar para a área de transferência:", err);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Pedido_${clienteNome.replace(/\s+/g, '_')}.png`;
                a.click();
                URL.revokeObjectURL(url);
                alert("A imagem do pedido foi gerada e baixada.");
            }
        }, 'image/png');

    } catch (error) {
        console.error("Erro ao exportar imagem do pedido:", error);
        alert("Ocorreu um erro ao gerar a imagem do pedido.");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

/**
 * Abre diretamente a janela de impressão em formato retrato,
 * com o cabeçalho original mantido e o restante com fundo branco e fontes pretas.
 */
function imprimirPedido() {
    if (pedidosState.cartItems.length === 0) {
        alert("Adicione pelo menos um item ao pedido para imprimir.");
        return;
    }

    const clienteNome = pedidosState.clientName.trim() || 'Não Informado';
    const totalValor = pedidosState.cartItems.reduce((sum, item) => sum + (item.qtdCx * item.precoCxNegociado), 0);
    const totalItens = pedidosState.cartItems.length;

    const rowsHtml = pedidosState.cartItems.map(item => {
        const subtotal = item.qtdCx * item.precoCxNegociado;
        const precoCxFormatted = item.precoCxNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const precoUndFormatted = item.precoUndNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const barcodeText = formatBarcodeCode39(item.rawCode || item.formattedCode);

        return `
        <tr>
            <td style="color: #0284c7; font-weight: bold;">${item.formattedCode}</td>
            <td style="font-weight: bold; color: #1e293b;">${item.descricao}</td>
            <td style="text-align: center; font-weight: bold; color: #1e293b;">${item.qtdCx} CX</td>
            <td style="text-align: right; color: #1e293b;">
                ${precoCxFormatted}
                <div style="font-size: 8pt; color: #64748b;">Und: ${precoUndFormatted}</div>
            </td>
            <td style="text-align: right; color: #15803d; font-weight: bold;">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td style="text-align: center;"><span class="barcode-font">${barcodeText}</span></td>
        </tr>
        `;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
        alert("A janela de impressão foi bloqueada pelo navegador. Permita pop-ups para este site.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Impressão de Pedido - ${clienteNome}</title>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: portrait;
                    margin: 12mm;
                }
                body {
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                    margin: 0;
                    padding: 0;
                    font-size: 10pt;
                }
                .barcode-font {
                    font-family: 'Libre Barcode 39', cursive, monospace;
                    font-size: 22pt;
                    font-weight: normal;
                    display: inline-block;
                    white-space: nowrap;
                    color: #000000;
                }
                /* Cabeçalho na cor original para destaque */
                .export-header {
                    background-color: #0b1120 !important;
                    color: #f8fafc !important;
                    padding: 16px;
                    border-radius: 6px;
                    border-bottom: 3px solid #38bdf8;
                    margin-bottom: 16px;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .export-title {
                    font-size: 16pt;
                    font-weight: 800;
                    color: #38bdf8 !important;
                    margin-bottom: 10px;
                }
                .export-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10pt;
                    background-color: #131d31 !important;
                    color: #f8fafc !important;
                    padding: 10px 14px;
                    border-radius: 6px;
                    border: 1px solid #26334d;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9.5pt;
                    margin-top: 10px;
                }
                th, td {
                    padding: 8px 10px;
                    border-bottom: 1px solid #cbd5e1;
                    text-align: left;
                }
                th {
                    background-color: #f1f5f9 !important;
                    color: #334155 !important;
                    font-weight: 700;
                    border-top: 1px solid #cbd5e1;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                tr:nth-child(even) td {
                    background-color: #f8fafc !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            </style>
        </head>
        <body>
            <div class="export-header">
                <div class="export-title">📦 StockAnalytics - Espelho de Pedido</div>
                <div class="export-meta">
                    <div>👤 <strong>CLIENTE:</strong> ${clienteNome}</div>
                    <div>📦 <strong>ITENS:</strong> ${totalItens}</div>
                    <div>💰 <strong>VALOR TOTAL:</strong> <span style="color: #4ade80; font-weight: bold;">${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Código</th>
                        <th style="width: 32%;">Descrição</th>
                        <th style="width: 10%; text-align: center;">Qtd. CX</th>
                        <th style="width: 14%; text-align: right;">PreçoCX</th>
                        <th style="width: 14%; text-align: right;">Subtotal</th>
                        <th style="width: 15%; text-align: center;">C. Barras</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}
/**
 * Atualiza o menu de seleção (<select>) com os nomes dos clientes que têm pedidos salvos
 */
function updateClientesSelect() {
    const select = document.getElementById('pedidosClienteSelect');
    if (!select) return;

    const valorAtual = pedidosState.clientName;
    select.innerHTML = '<option value="">-- Selecione ou Criar Novo --</option>';

    Object.keys(pedidosState.savedOrders).forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente;
        option.textContent = cliente;
        select.appendChild(option);
    });

    select.value = valorAtual;
}
/**
 * Gera um PDF unificado contendo todos os pedidos salvos (1 por página)
 * no layout de impressão (fundo branco, retrato) e abre a janela para salvar com a data do dia.
 */
async function exportarTodosPedidosPdf() {
    // Garante que o pedido atual exibido na tela seja salvo no estado antes de exportar
    const clienteAtual = pedidosState.clientName.trim();
    if (clienteAtual !== '' && pedidosState.cartItems.length > 0) {
        pedidosState.savedOrders[clienteAtual] = [...pedidosState.cartItems];
    }

    const listaClientes = Object.keys(pedidosState.savedOrders).filter(
        cli => pedidosState.savedOrders[cli] && pedidosState.savedOrders[cli].length > 0
    );

    if (listaClientes.length === 0) {
        alert("Não há nenhum pedido salvo para exportar.");
        return;
    }

    const btn = document.getElementById('btnExportarTudoPedido');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '⏳ Gerando PDF...';
        btn.disabled = true;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const fileNameDate = `${year}-${month}-${day}`;

        listaClientes.forEach((clienteNome, index) => {
            if (index > 0) {
                doc.addPage();
            }

            const items = pedidosState.savedOrders[clienteNome];
            const totalValor = items.reduce((sum, item) => sum + (item.qtdCx * item.precoCxNegociado), 0);
            const totalItens = items.length;

            // Cabeçalho escuro de destaque para cada pedido
            doc.setFillColor(11, 17, 32);
            doc.roundedRect(8, 8, 194, 22, 2, 2, 'F');

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(56, 189, 248);
            doc.text("StockAnalytics - Espelho de Pedido", 12, 15);

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(248, 250, 252);
            doc.text(`CLIENTE: ${clienteNome}`, 12, 23);
            doc.text(`QTD. ITENS: ${totalItens}`, 110, 23);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(74, 222, 128);
            doc.text(`TOTAL: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 155, 23);

            // Tabela de produtos do pedido
            const headers = [["Código", "Descrição", "Qtd. CX", "PreçoCX", "Subtotal", "C. Barras"]];
            const bodyData = items.map(item => {
                const subtotal = item.qtdCx * item.precoCxNegociado;
                const barcodeText = formatBarcodeCode39(item.rawCode || item.formattedCode);
                return [
                    item.formattedCode,
                    item.descricao,
                    `${item.qtdCx} CX`,
                    item.precoCxNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    barcodeText
                ];
            });

            doc.autoTable({
                head: headers,
                body: bodyData,
                startY: 33,
                margin: { left: 8, right: 8, bottom: 20 },
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 1.5,
                    valign: 'middle',
                    lineColor: [203, 213, 225],
                    lineWidth: 0.15,
                    textColor: [15, 23, 42]
                },
                headStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [51, 65, 85],
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                columnStyles: {
                    0: { cellWidth: 26, fontStyle: 'bold', textColor: [2, 132, 199] },
                    1: { cellWidth: 68, fontStyle: 'bold' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 26, halign: 'right' },
                    4: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] },
                    5: { cellWidth: 28, halign: 'center', font: 'courier' }
                },
                didDrawPage: (data) => {
                    const pageHeight = doc.internal.pageSize.height;
                    const pageWidth = doc.internal.pageSize.width;

                    doc.setFontSize(7.5);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(71, 85, 105);

                    doc.text("Assinatura do Cliente: ___________________________", 8, pageHeight - 10);
                    doc.text("Data: ____/____/________", 110, pageHeight - 10);

                    const generationStamp = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
                    doc.setFontSize(6.5);
                    doc.text(generationStamp, 8, pageHeight - 4);
                    doc.text(`Pedido ${index + 1} de ${listaClientes.length}`, pageWidth - 28, pageHeight - 4);
                }
            });
        });

        // Salva o PDF abrindo a caixa de diálogo para escolha de local com o nome da data do dia
        doc.save(`${fileNameDate}.pdf`);

    } catch (err) {
        console.error("Erro ao gerar PDF unificado de pedidos:", err);
        alert("Ocorreu um erro ao gerar o relatório exportado.");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}