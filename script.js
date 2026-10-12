let dynamicSuppliersMap = {};

const CONFIG_TARGET_FILES = {
    smg12: ['smg12', 'f170'],
    smg13: ['smg13', 'biblia'],
    fornecedores: ['fornecedor', 'fornecedores'],
    vendaAtual: ['venda_atual', 'atual', 'vendas', 'venda'],
    vendaAnterior: ['venda_anterior', 'anterior', 'ano_passado', 'vda_ant']
};

const state = {
    rawProcessedData: [],
    filteredData: [],
    activeTab: 'tab-dashboard',
    currentPage: 1,
    pageSize: 100,
    sort: { key: null, direction: 'asc' },
    activeDiversificadoFilter: null,
    diversificadoParams: { minIdade: null, maxValor: null },
    isvParams: { minIdade: 7, minDiasSemVenda: 7 },
    baixaAutonomiaParams: { maxDias: 15 },
    rankingSorts: {
        compradores: { key: 'diferencaVendas', direction: 'desc' },
        grupos: { key: 'diferencaVendas', direction: 'desc' },
        subgrupos: { key: 'diferencaVendas', direction: 'desc' }
    },
    activeAbcBuyers: null
};

let elements = {};

// INSTÂNCIAS DOS GRÁFICOS (CHART.JS)
let chartCompradoresInstance = null;
let chartStatusFlInstance = null;
let chartStatusIsvInstance = null;
let chartBaixoGiroInstance = null;
let chartGruposInstance = null;
let chartSubgruposInstance = null;
let chartParetoInstance = null;
let chartEstoqueVendasInstance = null;
let chartFornecedoresInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    elements = {
        folderInput: document.getElementById('folderInput'),
        syncStatus: document.getElementById('syncStatus'),
        syncText: document.getElementById('syncText'),
        globalControlsSection: document.getElementById('globalControlsSection'),
        sharedPaginationBar: document.getElementById('sharedPaginationBar'),

        globalSearch: document.getElementById('globalSearch'),
        searchEmbalagem: document.getElementById('searchEmbalagem'),
        filterComprador: document.getElementById('filterComprador'),
        filterCompradorSales: document.getElementById('filterCompradorSales'),
        filterFornecedor: document.getElementById('filterFornecedor'),
        filterSta: document.getElementById('filterSta'),
        filterDiversificado: document.getElementById('filterDiversificado'),
        filterGrupo: document.getElementById('filterGrupo'),
        filterClasse: document.getElementById('filterClasse'),
        filterGrupoSales: document.getElementById('filterGrupoSales'),
        filterSubgrupoSales: document.getElementById('filterSubgrupoSales'),
        filterClasseSales: document.getElementById('filterClasseSales'),
        toggleOnlyInStock: document.getElementById('toggleOnlyInStock'),
        toggleOnlyPendingOrders: document.getElementById('toggleOnlyPendingOrders'),
        lblToggleStock: document.getElementById('lblToggleStock'),
        lblTogglePending: document.getElementById('lblTogglePending'),
        btnClearFilters: document.getElementById('btnClearFilters'),
        
        pdfDropdownWrapper: document.getElementById('pdfDropdownWrapper'),
        btnPdfMenu: document.getElementById('btnPdfMenu'),
        dropdownPdf: document.getElementById('dropdownPdf'),
        btnExportSimplePdf: document.getElementById('btnExportSimplePdf'),
        btnExportDetailedPdf: document.getElementById('btnExportDetailedPdf'),
        btnToggleCols: document.getElementById('btnToggleCols'),
        dropdownCols: document.getElementById('dropdownCols'),
        columnToggleWrapper: document.getElementById('columnToggleWrapper'),
        btnToggleCharts: document.getElementById('btnToggleCharts'),
        dropdownCharts: document.getElementById('dropdownCharts'),
        chartToggleWrapper: document.getElementById('chartToggleWrapper'),
        
        // KPIS DASHBOARD
        kpiTotalSkus: document.getElementById('kpiTotalSkus'),
        kpiValorEstoqueTotal: document.getElementById('kpiValorEstoqueTotal'),
        kpiWarning: document.getElementById('kpiWarning'),
        kpiCritical: document.getElementById('kpiCritical'),
        
        // KPIS DE VENDAS
        kpiVendaAnteriorTotal: document.getElementById('kpiVendaAnteriorTotal'),
        kpiVendaAtualTotal: document.getElementById('kpiVendaAtualTotal'),
        kpiDiferencaVendasTotal: document.getElementById('kpiDiferencaVendasTotal'),
        kpiPctEvolucaoTotal: document.getElementById('kpiPctEvolucaoTotal'),

        // KPIS DOS GRÁFICOS DE VENDAS
        kpiChartsVendaAnterior: document.getElementById('kpiChartsVendaAnterior'),
        kpiChartsVendaAtual: document.getElementById('kpiChartsVendaAtual'),
        kpiChartsDiferencaVendas: document.getElementById('kpiChartsDiferencaVendas'),
        kpiChartsPctEvolucao: document.getElementById('kpiChartsPctEvolucao'),

        // CONTROLES DA ABA DE GRÁFICOS
        chartUnitType: document.getElementById('chartUnitType'),
        chartSortMetric: document.getElementById('chartSortMetric'),
        chartSortOrder: document.getElementById('chartSortOrder'),
        chartGridCols: document.getElementById('chartGridCols'),
        chartLimit: document.getElementById('chartLimit'),
        btnExportExecutivePdf: document.getElementById('btnExportExecutivePdf'),

        // TABELAS DE RANKING
        rankingCompradoresBody: document.getElementById('rankingCompradoresBody'),
        rankingGruposBody: document.getElementById('rankingGruposBody'),
        rankingSubgruposBody: document.getElementById('rankingSubgruposBody'),

        inventoryTable: document.getElementById('inventoryTable'),
        tableBody: document.getElementById('tableBody'),
        salesTableBody: document.getElementById('salesTableBody'),
        pageInfo: document.getElementById('pageInfo'),
        pageSize: document.getElementById('pageSize'),
        btnPrevPage: document.getElementById('btnPrevPage'),
        btnNextPage: document.getElementById('btnNextPage'),
        currentPageNum: document.getElementById('currentPageNum'),

        // MODAL DIVERSIFICADO
        modalFilterConfig: document.getElementById('modalFilterConfig'),
        btnCloseFilterConfig: document.getElementById('btnCloseFilterConfig'),
        btnCancelFilterConfig: document.getElementById('btnCancelFilterConfig'),
        btnApplyFilterConfig: document.getElementById('btnApplyFilterConfig'),
        inputMinIdade: document.getElementById('inputMinIdade'),
        inputMaxValor: document.getElementById('inputMaxValor'),

        // MODAL SETTINGS
        btnOpenSettings: document.getElementById('btnOpenSettings'),
        btnCloseSettings: document.getElementById('btnCloseSettings'),
        settingsModal: document.getElementById('settingsModal'),
        settingIsvMinIdade: document.getElementById('settingIsvMinIdade'),
        settingIsvMinDiasSemVenda: document.getElementById('settingIsvMinDiasSemVenda'),
        settingBaixaAutonomiaMaxDias: document.getElementById('settingBaixaAutonomiaMaxDias'),
        colorBgPrimary: document.getElementById('colorBgPrimary'),
        colorBgSurface: document.getElementById('colorBgSurface'),
        colorTextMain: document.getElementById('colorTextMain'),
        colorAccent: document.getElementById('colorAccent'),
        btnResetColors: document.getElementById('btnResetColors')
    };

    initDragAndDrop();
    initResizeObserver();

    // ORDENAÇÃO DOS RANKINGS
    document.querySelectorAll('.mini-ranking-table th[data-sort-key]').forEach(th => {
        th.addEventListener('click', () => {
            const rankingType = th.getAttribute('data-ranking');
            const sortKey = th.getAttribute('data-sort-key');
            handleRankingHeaderSort(rankingType, sortKey);
        });
    });

    // TROCA DE ABAS
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    elements.folderInput.addEventListener('change', handleFolderSelect);
    elements.globalSearch.addEventListener('input', () => { state.currentPage = 1; applyFilters(); });
    elements.searchEmbalagem.addEventListener('input', () => { state.currentPage = 1; applyFilters(); });
    elements.filterComprador.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
    elements.filterCompradorSales.addEventListener('change', () => {
        state.activeAbcBuyers = null;
        state.currentPage = 1; 
        applyFilters(); 
    });
    elements.filterFornecedor.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
    elements.filterSta.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
    
    elements.filterDiversificado.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'valor_idade') {
            elements.modalFilterConfig.classList.remove('hidden');
        } else if (val === 'isv') {
            state.activeDiversificadoFilter = 'isv';
            state.currentPage = 1;
            applyFilters();
        } else if (val === 'baixa_autonomia') {
            state.activeDiversificadoFilter = 'baixa_autonomia';
            state.currentPage = 1;
            applyFilters();
        } else if (val === 'baixo_giro') {
            state.activeDiversificadoFilter = 'baixo_giro';
            state.currentPage = 1;
            applyFilters();
        } else {
            state.activeDiversificadoFilter = null;
            state.diversificadoParams = { minIdade: null, maxValor: null };
            state.currentPage = 1;
            applyFilters();
        }
    });

    elements.btnCloseFilterConfig.addEventListener('click', cancelDiversificadoModal);
    elements.btnCancelFilterConfig.addEventListener('click', cancelDiversificadoModal);

    elements.btnApplyFilterConfig.addEventListener('click', () => {
        const minIdade = parseFloat(elements.inputMinIdade.value);
        const maxValor = parseFloat(elements.inputMaxValor.value);

        if (isNaN(minIdade) || isNaN(maxValor)) {
            alert('Por favor, informe valores válidos para Idade e Valor.');
            return;
        }

        state.activeDiversificadoFilter = 'valor_idade';
        state.diversificadoParams = { minIdade, maxValor };
        elements.modalFilterConfig.classList.add('hidden');
        state.currentPage = 1;
        applyFilters();
    });

    elements.filterGrupo.addEventListener('change', () => {
        updateClasseOptionsDashboard();
        state.currentPage = 1;
        applyFilters();
    });
    elements.filterClasse.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });

    elements.filterGrupoSales.addEventListener('change', () => {
        updateSubgrupoSalesOptions();
        updateClasseSalesOptions();
        state.currentPage = 1;
        applyFilters();
    });

    elements.filterSubgrupoSales.addEventListener('change', () => {
        updateClasseSalesOptions();
        state.currentPage = 1;
        applyFilters();
    });

    elements.filterClasseSales.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });

    elements.toggleOnlyInStock.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
    elements.toggleOnlyPendingOrders.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });

    elements.btnClearFilters.addEventListener('click', handleClearFilters);

    if (elements.chartUnitType) elements.chartUnitType.addEventListener('change', renderChartsTab);
    
    if (elements.chartSortMetric) {
        elements.chartSortMetric.addEventListener('change', (e) => {
            const key = e.target.value;
            const dir = elements.chartSortOrder ? elements.chartSortOrder.value : 'desc';
            state.rankingSorts.compradores = { key, direction: dir };
            state.rankingSorts.grupos = { key, direction: dir };
            state.rankingSorts.subgrupos = { key, direction: dir };
            renderChartsTab();
        });
    }

    if (elements.chartSortOrder) {
        elements.chartSortOrder.addEventListener('change', (e) => {
            const dir = e.target.value;
            state.rankingSorts.compradores.direction = dir;
            state.rankingSorts.grupos.direction = dir;
            state.rankingSorts.subgrupos.direction = dir;
            renderChartsTab();
        });
    }

    if (elements.chartGridCols) {
        elements.chartGridCols.addEventListener('change', (e) => {
            const cols = e.target.value;
            const grid = document.getElementById('chartsGrid');
            if (grid) {
                grid.classList.remove('grid-cols-2', 'grid-cols-3', 'grid-cols-4');
                grid.classList.add(`grid-cols-${cols}`);
                setTimeout(() => {
                    [chartCompradoresInstance, chartStatusFlInstance, chartStatusIsvInstance, chartBaixoGiroInstance, chartGruposInstance, chartSubgruposInstance, chartParetoInstance, chartEstoqueVendasInstance, chartFornecedoresInstance].forEach(c => c && c.resize());
                }, 50);
            }
        });
    }

    if (elements.chartLimit) elements.chartLimit.addEventListener('change', renderChartsTab);
    if (elements.btnExportExecutivePdf) elements.btnExportExecutivePdf.addEventListener('click', exportExecutivePdf);

    elements.pageSize.addEventListener('change', (e) => {
        state.pageSize = Number(e.target.value);
        state.currentPage = 1;
        renderUI();
    });

    elements.btnPrevPage.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderUI();
        }
    });

    elements.btnNextPage.addEventListener('click', () => {
        const maxPages = Math.ceil(state.filteredData.length / state.pageSize);
        if (state.currentPage < maxPages) {
            state.currentPage++;
            renderUI();
        }
    });

    document.querySelectorAll('.data-table th[data-sort-key]:not([data-ranking])').forEach(th => {
        th.addEventListener('click', () => {
            handleHeaderSort(th.getAttribute('data-sort-key'));
        });
    });

    elements.btnPdfMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.dropdownPdf.classList.toggle('hidden');
        elements.dropdownCols.classList.add('hidden');
        if (elements.dropdownCharts) elements.dropdownCharts.classList.add('hidden');
    });

    elements.btnExportSimplePdf.addEventListener('click', () => exportToPDF('simple'));
    elements.btnExportDetailedPdf.addEventListener('click', () => exportToPDF('detailed'));

    elements.btnToggleCols.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.dropdownCols.classList.toggle('hidden');
        elements.dropdownPdf.classList.add('hidden');
        if (elements.dropdownCharts) elements.dropdownCharts.classList.add('hidden');
    });

    if (elements.btnToggleCharts) {
        elements.btnToggleCharts.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.dropdownCharts.classList.toggle('hidden');
            elements.dropdownCols.classList.add('hidden');
            elements.dropdownPdf.classList.add('hidden');
        });
    }

    document.addEventListener('click', () => {
        elements.dropdownPdf.classList.add('hidden');
        elements.dropdownCols.classList.add('hidden');
        if (elements.dropdownCharts) elements.dropdownCharts.classList.add('hidden');
    });

    elements.dropdownCols.addEventListener('change', syncColumnVisibility);
    
    if (elements.dropdownCharts) {
        elements.dropdownCharts.addEventListener('change', syncChartVisibility);
    }

    elements.btnOpenSettings.addEventListener('click', () => {
        elements.settingsModal.classList.remove('hidden');
    });

    elements.btnCloseSettings.addEventListener('click', () => {
        elements.settingsModal.classList.add('hidden');
    });

    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.add('hidden');
        }
    });

    elements.settingIsvMinIdade.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.isvParams.minIdade = isNaN(val) ? 0 : val;
        if (state.activeDiversificadoFilter === 'isv') applyFilters();
    });

    elements.settingIsvMinDiasSemVenda.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.isvParams.minDiasSemVenda = isNaN(val) ? 0 : val;
        if (state.activeDiversificadoFilter === 'isv') applyFilters();
    });

    elements.settingBaixaAutonomiaMaxDias.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.baixaAutonomiaParams.maxDias = isNaN(val) ? 0 : val;
        if (state.activeDiversificadoFilter === 'baixa_autonomia') applyFilters();
    });

    elements.colorBgPrimary.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--bg-primary', e.target.value);
    });

    elements.colorBgSurface.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--bg-surface', e.target.value);
        document.documentElement.style.setProperty('--bg-header', e.target.value);
    });

    elements.colorTextMain.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--text-main', e.target.value);
    });

    elements.colorAccent.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--accent-blue', e.target.value);
    });

    elements.btnResetColors.addEventListener('click', () => {
        elements.settingIsvMinIdade.value = 7;
        elements.settingIsvMinDiasSemVenda.value = 7;
        state.isvParams = { minIdade: 7, minDiasSemVenda: 7 };

        elements.settingBaixaAutonomiaMaxDias.value = 15;
        state.baixaAutonomiaParams = { maxDias: 15 };

        elements.colorBgPrimary.value = '#0b1120';
        elements.colorBgSurface.value = '#1e293b';
        elements.colorTextMain.value = '#f8fafc';
        elements.colorAccent.value = '#38bdf8';

        document.documentElement.style.setProperty('--bg-primary', '#0b1120');
        document.documentElement.style.setProperty('--bg-surface', '#1e293b');
        document.documentElement.style.setProperty('--bg-header', '#0f172a');
        document.documentElement.style.setProperty('--text-main', '#f8fafc');
        document.documentElement.style.setProperty('--accent-blue', '#38bdf8');

        if (state.activeDiversificadoFilter) applyFilters();
    });
});

function handleRankingHeaderSort(rankingType, key) {
    if (!state.rankingSorts[rankingType]) return;

    if (state.rankingSorts[rankingType].key === key) {
        state.rankingSorts[rankingType].direction = state.rankingSorts[rankingType].direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.rankingSorts[rankingType].key = key;
        state.rankingSorts[rankingType].direction = 'desc';
    }

    renderChartsTab();
}

function updateRankingHeaderIcons() {
    document.querySelectorAll('.mini-ranking-table th[data-sort-key]').forEach(th => {
        const rankingType = th.getAttribute('data-ranking');
        const key = th.getAttribute('data-sort-key');
        
        th.classList.remove('sort-asc', 'sort-desc');

        if (state.rankingSorts[rankingType] && state.rankingSorts[rankingType].key === key) {
            th.classList.add(state.rankingSorts[rankingType].direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

function initResizeObserver() {
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const canvas = entry.target.querySelector('canvas');
                if (canvas) {
                    const chart = Chart.getChart(canvas);
                    if (chart) chart.resize();
                }
            }
        });

        document.querySelectorAll('.chart-card, .ranking-card').forEach(card => ro.observe(card));
    }
}

function initDragAndDrop() {
    const grid = document.getElementById('chartsGrid');
    if (!grid) return;

    let draggedCard = null;

    grid.querySelectorAll('.chart-card, .ranking-card').forEach(card => {
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedCard = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (card !== draggedCard) card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            if (draggedCard && card !== draggedCard) {
                const parent = card.parentNode;
                const siblings = Array.from(parent.children);
                const draggedIdx = siblings.indexOf(draggedCard);
                const targetIdx = siblings.indexOf(card);

                if (draggedIdx < targetIdx) {
                    card.after(draggedCard);
                } else {
                    card.before(draggedCard);
                }
            }
        });
    });
}

function syncChartVisibility() {
    const checkboxes = document.querySelectorAll('#dropdownCharts input[data-target-chart]');
    checkboxes.forEach(cb => {
        const targetId = cb.getAttribute('data-target-chart');
        const card = document.getElementById(targetId);
        if (card) {
            card.classList.toggle('hidden', !cb.checked);
        }
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === tabId) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });

    const isDashboard = tabId === 'tab-dashboard';
    const isSalesTab = tabId === 'tab-sales';
    const isChartsTab = tabId === 'tab-charts';

    if (elements.pdfDropdownWrapper) {
        elements.pdfDropdownWrapper.style.display = isDashboard ? 'inline-block' : 'none';
    }

    if (elements.globalControlsSection) {
        elements.globalControlsSection.style.display = isChartsTab ? 'none' : 'flex';
    }

    if (elements.sharedPaginationBar) {
        elements.sharedPaginationBar.style.display = isChartsTab ? 'none' : 'flex';
    }

    if (!isChartsTab) {
        if (elements.filterSta) {
            elements.filterSta.classList.toggle('hidden', isSalesTab);
            elements.filterSta.disabled = isSalesTab;
        }
        if (elements.filterDiversificado) {
            elements.filterDiversificado.classList.toggle('hidden', isSalesTab);
            elements.filterDiversificado.disabled = isSalesTab;
        }

        if (elements.filterComprador) {
            elements.filterComprador.classList.toggle('hidden', isSalesTab);
        }
        if (elements.filterCompradorSales) {
            elements.filterCompradorSales.classList.toggle('hidden', !isSalesTab);
            elements.filterCompradorSales.disabled = !isSalesTab && !state.rawProcessedData.length;
        }

        if (elements.filterGrupo) {
            elements.filterGrupo.classList.toggle('hidden', isSalesTab);
        }
        if (elements.filterClasse) {
            elements.filterClasse.classList.toggle('hidden', isSalesTab);
        }

        if (elements.filterGrupoSales) {
            elements.filterGrupoSales.classList.toggle('hidden', !isSalesTab);
            elements.filterGrupoSales.disabled = !isSalesTab && !state.rawProcessedData.length;
        }
        if (elements.filterSubgrupoSales) {
            elements.filterSubgrupoSales.classList.toggle('hidden', !isSalesTab);
            elements.filterSubgrupoSales.disabled = !isSalesTab && !state.rawProcessedData.length;
        }
        if (elements.filterClasseSales) {
            elements.filterClasseSales.classList.toggle('hidden', !isSalesTab);
            elements.filterClasseSales.disabled = !isSalesTab && !state.rawProcessedData.length;
        }

        if (elements.columnToggleWrapper) {
            elements.columnToggleWrapper.style.display = (tabId === 'tab-dashboard') ? 'block' : 'none';
        }

        applyFilters();
    } else {
        renderChartsTab();
    }
}

function cancelDiversificadoModal() {
    elements.modalFilterConfig.classList.add('hidden');
    if (!state.activeDiversificadoFilter || state.activeDiversificadoFilter !== 'valor_idade') {
        elements.filterDiversificado.value = state.activeDiversificadoFilter || '';
    }
}

function extractPackingFactor(embStr) {
    if (!embStr) return 1;
    const s = String(embStr).toUpperCase().trim();
    
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

function sanitizeComprador(raw) {
    if (!raw || raw === 'N/A' || String(raw).trim() === '') return 'N/A';
    let str = String(raw).trim();
    let parts = str.split('-');
    if (parts.length > 1) {
        let code = parts[0].trim().replace(/^0+/, '');
        let name = parts.slice(1).join('-').trim().toUpperCase();
        if (code) return `${code} - ${name}`;
        return name;
    }
    return str.toUpperCase();
}

window.filterByFornecedor = function(fornecedorFormatted) {
    elements.globalSearch.value = '';
    elements.searchEmbalagem.value = '';
    elements.filterFornecedor.value = fornecedorFormatted;
    state.currentPage = 1;
    applyFilters();
};

function cleanCNPJDigits(val) {
    if (!val) return '';
    let digits = String(val).replace(/\D/g, '');
    if (digits.length > 0 && digits.length <= 14) {
        return digits.padStart(14, '0');
    }
    return digits;
}

function formatSupplierNameAndCNPJ(val) {
    if (!val || val === 'Não Informado') return 'Não Informado';
    let digits = cleanCNPJDigits(val);
    if (digits.length === 14) {
        const formattedCNPJ = `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
        const knownName = dynamicSuppliersMap[digits];
        if (knownName) return `${knownName} (${formattedCNPJ})`;
        return formattedCNPJ;
    }
    return String(val);
}

function handleHeaderSort(key) {
    if (state.sort.key === key) {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.sort.key = key;
        state.sort.direction = 'asc';
    }
    applySort();
    renderUI();
}

function applySort() {
    if (!state.sort.key) return;

    const { key, direction } = state.sort;
    const multiplier = direction === 'asc' ? 1 : -1;

    state.filteredData.sort((a, b) => {
        let valA = a[key] ?? '';
        let valB = b[key] ?? '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * multiplier;
        }
        return String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true, sensitivity: 'base' }) * multiplier;
    });

    updateHeaderSortIcons();
}

function updateHeaderSortIcons() {
    document.querySelectorAll('.data-table th[data-sort-key]:not([data-ranking])').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.getAttribute('data-sort-key') === state.sort.key) {
            th.classList.add(state.sort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

function sanitizeProductCode(raw) {
    if (raw === null || raw === undefined) return '';
    let str = String(raw).trim();
    if (str.includes('-')) {
        str = str.split('-')[0].trim();
    } else if (str.includes('_')) {
        str = str.split('_')[0].trim();
    }
    const clean = str.replace(/[^a-zA-Z0-9]/g, '').replace(/^0+/, '');
    return clean || '0';
}

function handleClearFilters() {
    elements.globalSearch.value = '';
    elements.searchEmbalagem.value = '';
    elements.filterComprador.value = '';
    elements.filterCompradorSales.value = '';
    elements.filterFornecedor.value = '';
    elements.filterSta.value = '';
    elements.filterDiversificado.value = '';
    state.activeDiversificadoFilter = null;
    state.activeAbcBuyers = null;
    state.diversificadoParams = { minIdade: null, maxValor: null };

    elements.filterGrupo.value = '';
    updateClasseOptionsDashboard();
    elements.filterClasse.value = '';

    elements.filterGrupoSales.value = '';
    updateSubgrupoSalesOptions();
    elements.filterSubgrupoSales.value = '';
    updateClasseSalesOptions();
    elements.filterClasseSales.value = '';

    elements.toggleOnlyInStock.checked = false;
    elements.toggleOnlyPendingOrders.checked = false;

    state.sort.key = null;
    state.sort.direction = 'asc';
    updateHeaderSortIcons();

    state.currentPage = 1;
    applyFilters();
}

function formatOptionMetricsText(name, dif, pct) {
    const isNeg = dif < 0;
    const difFormatted = `${isNeg ? '-' : '+'}${Math.abs(dif).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    const pctFormatted = `${isNeg ? '' : '+'}${pct.toFixed(2)}%`;
    return `${name} (${difFormatted} | ${pctFormatted})`;
}

function updateClasseOptionsDashboard() {
    const selectedGrupo = elements.filterGrupo.value;
    const currentSelectedClasse = elements.filterClasse.value;

    let sourceData = state.rawProcessedData;
    if (selectedGrupo) {
        sourceData = sourceData.filter(i => i.grupoSubgrupo === selectedGrupo);
    }

    const classes = [...new Set(sourceData.map(i => i.classe))]
        .filter(c => c && c !== 'N/A')
        .sort();

    elements.filterClasse.innerHTML = '<option value="">Classe (Todas)</option>';
    classes.forEach(classe => {
        const opt = document.createElement('option');
        opt.value = classe;
        opt.textContent = classe;
        elements.filterClasse.appendChild(opt);
    });

    if (classes.includes(currentSelectedClasse)) {
        elements.filterClasse.value = currentSelectedClasse;
    } else {
        elements.filterClasse.value = '';
    }
}

function updateSubgrupoSalesOptions() {
    const selectedGrupo = elements.filterGrupoSales.value;
    const currentSelectedSubgrupo = elements.filterSubgrupoSales.value;

    let sourceData = state.rawProcessedData;
    if (selectedGrupo) {
        sourceData = sourceData.filter(i => i.grupo === selectedGrupo);
    }

    const subgrupos = [...new Set(sourceData.map(i => i.subgrupo))]
        .filter(s => s && s !== 'N/A')
        .sort();

    elements.filterSubgrupoSales.innerHTML = '<option value="">Subgrupo (Todos)</option>';
    subgrupos.forEach(sub => {
        let subItems = sourceData.filter(i => i.subgrupo === sub);
        const totalAnt = subItems.reduce((sum, i) => sum + i.vendaAnterior, 0);
        const totalAtu = subItems.reduce((sum, i) => sum + i.vendaAtual, 0);
        const dif = totalAtu - totalAnt;
        let pct = totalAnt > 0 ? (dif / totalAnt) * 100 : (totalAtu > 0 ? 100 : 0);

        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = formatOptionMetricsText(sub, dif, pct);
        if (dif < 0) opt.classList.add('opt-negative');
        else if (dif > 0) opt.classList.add('opt-positive');
        elements.filterSubgrupoSales.appendChild(opt);
    });

    if (subgrupos.includes(currentSelectedSubgrupo)) {
        elements.filterSubgrupoSales.value = currentSelectedSubgrupo;
    } else {
        elements.filterSubgrupoSales.value = '';
    }
}

function updateClasseSalesOptions() {
    const selGrupo = elements.filterGrupoSales.value;
    const selSubgrupo = elements.filterSubgrupoSales.value;
    const currentSelectedClasse = elements.filterClasseSales.value;

    let sourceData = state.rawProcessedData;
    if (selGrupo) sourceData = sourceData.filter(i => i.grupo === selGrupo);
    if (selSubgrupo) sourceData = sourceData.filter(i => i.subgrupo === selSubgrupo);

    const classes = [...new Set(sourceData.map(i => i.classe))]
        .filter(c => c && c !== 'N/A')
        .sort();

    elements.filterClasseSales.innerHTML = '<option value="">Classe (Todas)</option>';
    classes.forEach(classe => {
        let classItems = sourceData.filter(i => i.classe === classe);
        const totalAnt = classItems.reduce((sum, i) => sum + i.vendaAnterior, 0);
        const totalAtu = classItems.reduce((sum, i) => sum + i.vendaAtual, 0);
        const dif = totalAtu - totalAnt;
        let pct = totalAnt > 0 ? (dif / totalAnt) * 100 : (totalAtu > 0 ? 100 : 0);

        const opt = document.createElement('option');
        opt.value = classe;
        opt.textContent = formatOptionMetricsText(classe, dif, pct);
        if (dif < 0) opt.classList.add('opt-negative');
        else if (dif > 0) opt.classList.add('opt-positive');
        elements.filterClasseSales.appendChild(opt);
    });

    if (classes.includes(currentSelectedClasse)) {
        elements.filterClasseSales.value = currentSelectedClasse;
    } else {
        elements.filterClasseSales.value = '';
    }
}

function populateDropdowns() {
    elements.filterComprador.innerHTML = '<option value="">Comprador (Todos)</option>';
    const compradores = [...new Set(state.rawProcessedData.map(i => i.comprador))]
        .filter(c => c && c !== 'N/A')
        .sort();

    compradores.forEach(comp => {
        const opt = document.createElement('option');
        opt.value = comp;
        opt.textContent = comp;
        elements.filterComprador.appendChild(opt);
    });

    elements.filterCompradorSales.innerHTML = '<option value="">Comprador (Todos)</option>';
    compradores.forEach(comp => {
        let itemsComp = state.rawProcessedData.filter(i => i.comprador === comp);
        const totalAnt = itemsComp.reduce((sum, i) => sum + i.vendaAnterior, 0);
        const totalAtu = itemsComp.reduce((sum, i) => sum + i.vendaAtual, 0);
        const dif = totalAtu - totalAnt;
        let pct = totalAnt > 0 ? (dif / totalAnt) * 100 : (totalAtu > 0 ? 100 : 0);

        const opt = document.createElement('option');
        opt.value = comp;
        opt.textContent = formatOptionMetricsText(comp, dif, pct);
        if (dif < 0) opt.classList.add('opt-negative');
        else if (dif > 0) opt.classList.add('opt-positive');
        elements.filterCompradorSales.appendChild(opt);
    });

    elements.filterFornecedor.innerHTML = '<option value="">Fornecedor (Todos)</option>';
    const fornecedores = [...new Set(state.rawProcessedData.map(i => i.fornecedorFormatted))]
        .filter(f => f && f !== 'Não Informado')
        .sort();

    fornecedores.forEach(forn => {
        const opt = document.createElement('option');
        opt.value = forn;
        opt.textContent = forn;
        elements.filterFornecedor.appendChild(opt);
    });

    elements.filterSta.innerHTML = '<option value="">Status STA (Todos)</option>';
    const stas = [...new Set(state.rawProcessedData.map(i => i.sta))]
        .filter(s => s && s !== 'N/A' && s !== '')
        .sort();

    stas.forEach(sta => {
        const opt = document.createElement('option');
        opt.value = sta;
        opt.textContent = sta === ' ' ? 'Ativo (Vazio)' : sta;
        elements.filterSta.appendChild(opt);
    });

    elements.filterGrupo.innerHTML = '<option value="">Grupo / Subgrupo (Todos)</option>';
    const gruposCombinados = [...new Set(state.rawProcessedData.map(i => i.grupoSubgrupo))]
        .filter(g => g && g !== 'N/A / N/A')
        .sort();

    gruposCombinados.forEach(grupo => {
        const opt = document.createElement('option');
        opt.value = grupo;
        opt.textContent = grupo;
        elements.filterGrupo.appendChild(opt);
    });

    elements.filterGrupoSales.innerHTML = '<option value="">Grupo (Todos)</option>';
    const gruposUnicos = [...new Set(state.rawProcessedData.map(i => i.grupo))]
        .filter(g => g && g !== 'N/A')
        .sort();

    gruposUnicos.forEach(grp => {
        let grpItems = state.rawProcessedData.filter(i => i.grupo === grp);
        const totalAnt = grpItems.reduce((sum, i) => sum + i.vendaAnterior, 0);
        const totalAtu = grpItems.reduce((sum, i) => sum + i.vendaAtual, 0);
        const dif = totalAtu - totalAnt;
        let pct = totalAnt > 0 ? (dif / totalAnt) * 100 : (totalAtu > 0 ? 100 : 0);

        const opt = document.createElement('option');
        opt.value = grp;
        opt.textContent = formatOptionMetricsText(grp, dif, pct);
        if (dif < 0) opt.classList.add('opt-negative');
        else if (dif > 0) opt.classList.add('opt-positive');
        elements.filterGrupoSales.appendChild(opt);
    });

    updateClasseOptionsDashboard();
    updateSubgrupoSalesOptions();
    updateClasseSalesOptions();
}

function syncColumnVisibility() {
    const checkboxes = document.querySelectorAll('#dropdownCols input[data-target-col]');
    checkboxes.forEach(cb => {
        const targetCol = cb.getAttribute('data-target-col');
        const isVisible = cb.checked;
        document.querySelectorAll(`.col-${targetCol}`).forEach(el => {
            el.classList.toggle('hidden', !isVisible);
        });
    });
}

function parseBRNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = String(val).trim();
    
    let isNegative = false;
    if (str.startsWith('(') && str.endsWith(')')) {
        isNegative = true;
        str = str.slice(1, -1);
    }
    if (str.includes('-')) isNegative = true;

    str = str.replace(/-/g, '');

    if (str.includes(',') && !str.includes('.')) {
        str = str.replace(',', '.');
    } else if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    return isNegative ? -num : num;
}

function getRowSalesValue(row) {
    if (!row) return 0;
    const keys = [
        'VLR.TOTAL', 'VLR_TOTAL', 'VALOR_TOTAL', 'VALOR TOTAL', 
        'VLR TOTAL', 'VALOR', 'VLR_LIQUIDO', 'VLR.LIQ', 'VL.TOTAL'
    ];
    for (let key of keys) {
        if (row[key] !== undefined && row[key] !== null) return parseBRNumber(row[key]);
    }
    return 0;
}

function getRowSalesQuantity(row) {
    if (!row) return 0;
    const keys = [
        'QTD.TOTAL', 'QTD_TOTAL', 'QTDE_TOTAL', 'QTDE TOTAL', 
        'QTD', 'QTDE', 'QUANTIDADE', 'QTD_VENDA', 'QTD VENDA'
    ];
    for (let key of keys) {
        if (row[key] !== undefined && row[key] !== null) return parseBRNumber(row[key]);
    }
    return 0;
}

async function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let file12 = null, file13 = null, fileForn = null, fileVendaAtual = null, fileVendaAnterior = null;

    files.forEach(file => {
        const nameLower = file.name.toLowerCase();
        if (CONFIG_TARGET_FILES.smg12.some(key => nameLower.includes(key))) file12 = file;
        if (CONFIG_TARGET_FILES.smg13.some(key => nameLower.includes(key))) file13 = file;
        if (CONFIG_TARGET_FILES.fornecedores.some(key => nameLower.includes(key))) fileForn = file;

        if (CONFIG_TARGET_FILES.vendaAnterior.some(key => nameLower.includes(key))) {
            fileVendaAnterior = file;
        } else if (CONFIG_TARGET_FILES.vendaAtual.some(key => nameLower.includes(key))) {
            fileVendaAtual = file;
        }
    });

    if (!file12 || !file13) {
        updateSyncStatus('error', 'Planilhas não encontradas');
        alert("Erro: A pasta precisa conter os arquivos SMG12 e SMG13.");
        return;
    }

    updateSyncStatus('pending', 'Lendo planilhas...');

    try {
        dynamicSuppliersMap = {};
        if (fileForn) {
            const jsonForn = await parseFileToJSON(fileForn);
            jsonForn.forEach(row => {
                const cnpjRaw = row['CNPJ'] || row['cnpj'] || row['Cnpj'] || row['FORNECEDOR'] || '';
                const nome = row['NOME'] || row['Nome'] || row['RAZAO SOCIAL'] || row['Razao Social'] || row['NOME FANTASIA'] || row['Nome Fantasia'] || '';
                const cleanDigits = cleanCNPJDigits(cnpjRaw);
                if (cleanDigits && nome) {
                    dynamicSuppliersMap[cleanDigits] = String(nome).trim();
                }
            });
        }

        const json12 = await parseFileToJSON(file12);
        const json13 = await parseFileToJSON(file13);

        let jsonVendaAtual = [];
        let jsonVendaAnterior = [];

        if (fileVendaAtual) jsonVendaAtual = await parseFileToJSON(fileVendaAtual);
        if (fileVendaAnterior) jsonVendaAnterior = await parseFileToJSON(fileVendaAnterior);

        state.rawProcessedData = processData(json12, json13, jsonVendaAtual, jsonVendaAnterior);
        state.filteredData = [...state.rawProcessedData];

        populateDropdowns();
        enableControls();
        updateSyncStatus('ok', 'Sincronizado');
        
        if (state.activeTab === 'tab-charts') {
            renderChartsTab();
        } else {
            applyFilters();
        }
    } catch (err) {
        console.error(err);
        updateSyncStatus('error', 'Falha ao processar');
    }
}

function parseFileToJSON(file) {
    return new Promise((resolve, reject) => {
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                if (isCsv) {
                    const text = e.target.result;
                    const workbook = XLSX.read(text, { type: 'string', raw: true });
                    const firstSheet = workbook.SheetNames[0];
                    const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                    resolve(json);
                } else {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', raw: true });
                    const firstSheet = workbook.SheetNames[0];
                    const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                    resolve(json);
                }
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

function processData(smg12Array, smg13Array, vendaAtualArray = [], vendaAnteriorArray = []) {
    const map13 = new Map();
    smg13Array.forEach(row => {
        const rawCode = row['Código'] || row['MERC'] || row['MERCADORIA'] || row['MERCADC'] || '';
        if (!rawCode) return;
        const cleanKey = sanitizeProductCode(rawCode);
        
        map13.set(cleanKey, {
            sta: row['Sta'] !== undefined && row['Sta'] !== null ? String(row['Sta']).trim() : 'N/A',
            pedFornec: parseBRNumber(row['Pedido Pendente Fornec.']),
            pedFilial: parseBRNumber(row['Pedido Pendente Filial']),
            pedFat: parseBRNumber(row['Pedido Pendente N. Fat'])
        });
    });

    const mapVendaAtual = new Map();
    const mapQtdAtual = new Map();
    const detailsVendaAtual = new Map();
    vendaAtualArray.forEach(row => {
        const rawCode = row['MERCADC'] || row['MERCADORIA'] || row['MERC'] || row['Código'] || row['CODIGO'] || row['PRODUTO'] || '';
        if (!rawCode) return;
        const cleanKey = sanitizeProductCode(rawCode);
        const vlrVenda = getRowSalesValue(row);
        const qtdVenda = getRowSalesQuantity(row);

        mapVendaAtual.set(cleanKey, (mapVendaAtual.get(cleanKey) || 0) + vlrVenda);
        mapQtdAtual.set(cleanKey, (mapQtdAtual.get(cleanKey) || 0) + qtdVenda);

        if (!detailsVendaAtual.has(cleanKey)) {
            detailsVendaAtual.set(cleanKey, {
                codigoCompleto: rawCode,
                descricao: row['DESCRICAO'] || row['DESCRICA'] || row['PRODUTO'] || 'Produto Vendas',
                embalagem: row['EMBALAGEM'] || '',
                comprador: sanitizeComprador(row['COMPRADOR']),
                grupo: row['GRUPO'] || 'N/A',
                subgrupo: row['SUB-GRUPO'] || row['SUBGRUPO'] || 'N/A',
                classe: row['CLASSE'] || 'N/A'
            });
        }
    });

    const mapVendaAnterior = new Map();
    const mapQtdAnterior = new Map();
    const detailsVendaAnterior = new Map();
    vendaAnteriorArray.forEach(row => {
        const rawCode = row['MERCADC'] || row['MERCADORIA'] || row['MERC'] || row['Código'] || row['CODIGO'] || row['PRODUTO'] || '';
        if (!rawCode) return;
        const cleanKey = sanitizeProductCode(rawCode);
        const vlrVenda = getRowSalesValue(row);
        const qtdVenda = getRowSalesQuantity(row);

        mapVendaAnterior.set(cleanKey, (mapVendaAnterior.get(cleanKey) || 0) + vlrVenda);
        mapQtdAnterior.set(cleanKey, (mapQtdAnterior.get(cleanKey) || 0) + qtdVenda);

        if (!detailsVendaAnterior.has(cleanKey)) {
            detailsVendaAnterior.set(cleanKey, {
                codigoCompleto: rawCode,
                descricao: row['DESCRICAO'] || row['DESCRICA'] || row['PRODUTO'] || 'Produto Vendas',
                embalagem: row['EMBALAGEM'] || '',
                comprador: sanitizeComprador(row['COMPRADOR']),
                grupo: row['GRUPO'] || 'N/A',
                subgrupo: row['SUB-GRUPO'] || row['SUBGRUPO'] || 'N/A',
                classe: row['CLASSE'] || 'N/A'
            });
        }
    });

    const processedKeys = new Set();

    const itemsList = smg12Array.map(item => {
        const rawMerc = String(item['MERC'] || item['MERCADORIA'] || item['MERCADC'] || '');
        const cleanKey = sanitizeProductCode(rawMerc);
        processedKeys.add(cleanKey);
        
        const extra = map13.get(cleanKey) || { sta: 'N/A', pedFornec: 0, pedFilial: 0, pedFat: 0 };
        const totalPedidos = extra.pedFornec + extra.pedFilial + extra.pedFat;
        const diasSemVenda = parseBRNumber(item['DIAS S/VND']);

        const estoqEmb1 = parseBRNumber(item['ESTOQ EMB1']);
        const estoqEmb9 = parseBRNumber(item['ESTOQ EMB9']);
        const custoMedio = parseBRNumber(item['CUSTO MEDIO']);
        const venda30Dias = parseBRNumber(item['QTD VENDA EMB1']);
        const precoVenda = parseBRNumber(item['PRECO VENDA']);

        const embStr = item['EMBALAGEM'] || '';
        const packingFactor = extractPackingFactor(embStr);
        
        const custoUnidade = packingFactor > 0 ? (custoMedio / packingFactor) : custoMedio;
        const precoUnidade = packingFactor > 0 ? (precoVenda / packingFactor) : precoVenda;

        const totalCaixas = estoqEmb1 + (packingFactor > 0 ? (estoqEmb9 / packingFactor) : 0);
        const valorEstoqueTotal = totalCaixas * custoMedio;

        let autonomiaDias = 0;
        if (venda30Dias > 0) autonomiaDias = (estoqEmb1 / venda30Dias) * 30;

        let riskLevel = 'normal';
        if (diasSemVenda > 6) riskLevel = 'critical';
        else if (diasSemVenda > 2) riskLevel = 'warning';

        const grupoStr = item['GRUPO'] ? String(item['GRUPO']).trim() : 'N/A';
        const subgrupoStr = item['SUBGRUPO'] ? String(item['SUBGRUPO']).trim() : 'N/A';
        const classeStr = item['CLASSE'] ? String(item['CLASSE']).trim() : 'N/A';

        const rawFornec = item['FORNECEDOR'] || '';
        const fornecedorFormatted = formatSupplierNameAndCNPJ(rawFornec);

        const vdaAtual = mapVendaAtual.get(cleanKey) || 0;
        const vdaAnterior = mapVendaAnterior.get(cleanKey) || 0;
        const qtdAtual = mapQtdAtual.get(cleanKey) || (vdaAtual > 0 ? venda30Dias : 0);
        const qtdAnterior = mapQtdAnterior.get(cleanKey) || 0;

        const difVendas = vdaAtual - vdaAnterior;

        let pctEvolucao = 0;
        if (vdaAnterior > 0) {
            pctEvolucao = ((vdaAtual - vdaAnterior) / vdaAnterior) * 100;
        } else if (vdaAtual > 0) {
            pctEvolucao = 100;
        }

        const rawComp = item['COMPRADOR'] || detailsVendaAtual.get(cleanKey)?.comprador || detailsVendaAnterior.get(cleanKey)?.comprador || 'N/A';
        const compradorFormatted = sanitizeComprador(rawComp);

        return {
            id: cleanKey,
            codigoCompleto: rawMerc,
            digito: item['DIGITO'] || '',
            descricao: item['DESCRICAO'] || 'Sem Descrição',
            embalagem: embStr,
            packingFactor: packingFactor,
            fornecedor: rawFornec,
            fornecedorFormatted: fornecedorFormatted,
            qtdIdeal: parseBRNumber(item['QTDE IDEAL']),
            dtUltEnt: item['DT ULT ENT'] || '',
            qtdUltEnt: parseBRNumber(item['QTD ULT ENT']),
            estoqEmb1: estoqEmb1,
            estoqEmb9: estoqEmb9,
            custoMedio: custoMedio,
            custoUnidade: custoUnidade,
            valorEstoqueTotal: valorEstoqueTotal,
            autonomiaDias: autonomiaDias,
            venda30Dias: venda30Dias,
            precoVenda: precoVenda,
            precoUnidade: precoUnidade,
            rentabilidade: parseBRNumber(item['PERC RENT']),
            idade: Math.round(parseBRNumber(item['IDADE'])),
            comprador: compradorFormatted,
            grupo: grupoStr,
            subgrupo: subgrupoStr,
            grupoSubgrupo: `${grupoStr} / ${subgrupoStr}`,
            classe: classeStr,
            bloq1: item['BLOQ1'] || '',
            bloq9: item['BLOQ9'] || '',
            prFixo: item['PR.FIXO'] || '',
            diasSemVenda: diasSemVenda,
            sta: extra.sta === '' ? 'Ativo' : extra.sta,
            pedFornec: extra.pedFornec,
            pedFilial: extra.pedFilial,
            pedFat: extra.pedFat,
            pedidosPendentes: totalPedidos,
            riskLevel: riskLevel,
            vendaAnterior: vdaAnterior,
            vendaAtual: vdaAtual,
            qtdAnterior: qtdAnterior,
            qtdAtual: qtdAtual,
            diferencaVendas: difVendas,
            pctEvolucao: pctEvolucao
        };
    });

    const allSalesKeys = new Set([...mapVendaAtual.keys(), ...mapVendaAnterior.keys()]);
    
    allSalesKeys.forEach(cleanKey => {
        if (!processedKeys.has(cleanKey)) {
            const vdaAtual = mapVendaAtual.get(cleanKey) || 0;
            const vdaAnterior = mapVendaAnterior.get(cleanKey) || 0;
            const qtdAtual = mapQtdAtual.get(cleanKey) || 0;
            const qtdAnterior = mapQtdAnterior.get(cleanKey) || 0;

            const difVendas = vdaAtual - vdaAnterior;

            let pctEvolucao = 0;
            if (vdaAnterior > 0) {
                pctEvolucao = ((vdaAtual - vdaAnterior) / vdaAnterior) * 100;
            } else if (vdaAtual > 0) {
                pctEvolucao = 100;
            }

            const det = detailsVendaAnterior.get(cleanKey) || detailsVendaAtual.get(cleanKey) || {};
            const extra = map13.get(cleanKey) || { sta: 'S/ ESTOQUE', pedFornec: 0, pedFilial: 0, pedFat: 0 };

            itemsList.push({
                id: cleanKey,
                codigoCompleto: det.codigoCompleto || cleanKey,
                digito: '',
                descricao: det.descricao || 'Produto de Vendas sem Cadastro',
                embalagem: det.embalagem || '-',
                packingFactor: 1,
                fornecedor: '',
                fornecedorFormatted: 'Não Informado',
                qtdIdeal: 0,
                dtUltEnt: '',
                qtdUltEnt: 0,
                estoqEmb1: 0,
                estoqEmb9: 0,
                custoMedio: 0,
                custoUnidade: 0,
                valorEstoqueTotal: 0,
                autonomiaDias: 0,
                venda30Dias: 0,
                precoVenda: 0,
                precoUnidade: 0,
                rentabilidade: 0,
                idade: 0,
                comprador: sanitizeComprador(det.comprador),
                grupo: det.grupo || 'N/A',
                subgrupo: det.subgrupo || 'N/A',
                grupoSubgrupo: `${det.grupo || 'N/A'} / ${det.subgrupo || 'N/A'}`,
                classe: det.classe || 'N/A',
                bloq1: '',
                bloq9: '',
                prFixo: '',
                diasSemVenda: 0,
                sta: extra.sta === 'N/A' ? 'S/ ESTOQUE' : extra.sta,
                pedFornec: extra.pedFornec,
                pedFilial: extra.pedFilial,
                pedFat: extra.pedFat,
                pedidosPendentes: extra.pedFornec + extra.pedFilial + extra.pedFat,
                riskLevel: 'normal',
                vendaAnterior: vdaAnterior,
                vendaAtual: vdaAtual,
                qtdAnterior: qtdAnterior,
                qtdAtual: qtdAtual,
                diferencaVendas: difVendas,
                pctEvolucao: pctEvolucao
            });
        }
    });

    return itemsList;
}

function updateSyncStatus(type, text) {
    elements.syncStatus.className = `sync-status status-${type}`;
    elements.syncText.textContent = text;
}

function enableControls() {
    elements.globalSearch.disabled = false;
    elements.searchEmbalagem.disabled = false;
    elements.filterFornecedor.disabled = false;
    
    if (state.activeTab !== 'tab-sales') {
        elements.filterComprador.disabled = false;
        elements.filterSta.disabled = false;
        elements.filterDiversificado.disabled = false;
        elements.filterGrupo.disabled = false;
        elements.filterClasse.disabled = false;
    } else {
        elements.filterCompradorSales.disabled = false;
        elements.filterGrupoSales.disabled = false;
        elements.filterSubgrupoSales.disabled = false;
        elements.filterClasseSales.disabled = false;
    }

    elements.toggleOnlyInStock.disabled = false;
    elements.toggleOnlyPendingOrders.disabled = false;
    elements.lblToggleStock.classList.remove('disabled');
    elements.lblTogglePending.classList.remove('disabled');
    elements.btnClearFilters.disabled = false;
    elements.btnToggleCols.disabled = false;
    elements.btnPdfMenu.disabled = false;
}

function applyFilters() {
    const rawSearch = elements.globalSearch.value.toLowerCase().trim();
    const searchTokens = rawSearch ? rawSearch.split(/\s+/).filter(t => t.length > 0) : [];

    const rawEmbSearch = elements.searchEmbalagem.value.toLowerCase().trim();
    const embTokens = rawEmbSearch ? rawEmbSearch.split(/\s+/).filter(t => t.length > 0) : [];

    const isSalesTab = state.activeTab === 'tab-sales';

    const compradorFilter = isSalesTab ? elements.filterCompradorSales.value : elements.filterComprador.value;
    const fornecedorFilter = elements.filterFornecedor.value;
    const staFilter = elements.filterSta.value;
    
    const grupoFilterCombined = elements.filterGrupo.value;
    const grupoSalesFilter = elements.filterGrupoSales.value;
    const subgrupoSalesFilter = elements.filterSubgrupoSales.value;
    const classeSalesFilter = elements.filterClasseSales.value;

    const classeFilterCombined = elements.filterClasse.value;

    const onlyInStock = elements.toggleOnlyInStock.checked;
    const onlyPendingOrders = elements.toggleOnlyPendingOrders.checked;

    state.filteredData = state.rawProcessedData.filter(item => {
        const fullItemText = `${item.codigoCompleto} ${item.descricao} ${item.fornecedorFormatted} ${item.comprador} ${item.grupoSubgrupo} ${item.classe} ${item.sta}`.toLowerCase();
        const embText = (item.embalagem || '').toLowerCase();

        const matchSearch = searchTokens.length === 0 || searchTokens.every(token => fullItemText.includes(token));
        const matchEmbalagem = embTokens.length === 0 || embTokens.every(token => embText.includes(token));

        let matchComprador = true;
        if (state.activeAbcBuyers && isSalesTab) {
            matchComprador = state.activeAbcBuyers.includes(item.comprador);
        } else if (compradorFilter) {
            matchComprador = item.comprador === compradorFilter;
        }

        const matchFornec = !fornecedorFilter || item.fornecedorFormatted === fornecedorFilter;
        const matchSta = isSalesTab || !staFilter || item.sta.toUpperCase().trim() === staFilter.toUpperCase().trim();

        let matchDiversificado = true;
        if (!isSalesTab) {
            if (state.activeDiversificadoFilter === 'valor_idade') {
                const { minIdade, maxValor } = state.diversificadoParams;
                const limitValor = (maxValor !== null && maxValor !== undefined && maxValor > 0) ? maxValor : Infinity;
                matchDiversificado = (item.idade > (minIdade || 0)) && (item.valorEstoqueTotal < limitValor);
            } else if (state.activeDiversificadoFilter === 'isv') {
                const { minIdade, minDiasSemVenda } = state.isvParams;
                matchDiversificado = (item.idade > minIdade) && (item.diasSemVenda > minDiasSemVenda);
            } else if (state.activeDiversificadoFilter === 'baixa_autonomia') {
                const { maxDias } = state.baixaAutonomiaParams;
                matchDiversificado = (item.venda30Dias > 0) && (item.autonomiaDias < maxDias) && (item.pedidosPendentes === 0);
            } else if (state.activeDiversificadoFilter === 'baixo_giro') {
                matchDiversificado = (item.idade > 90);
            }
        }

        let matchGrupoClasse = true;
        if (isSalesTab) {
            const matchGrp = !grupoSalesFilter || item.grupo === grupoSalesFilter;
            const matchSub = !subgrupoSalesFilter || item.subgrupo === subgrupoSalesFilter;
            const matchCla = !classeSalesFilter || item.classe === classeSalesFilter;
            matchGrupoClasse = matchGrp && matchSub && matchCla;
        } else {
            const matchGrp = !grupoFilterCombined || item.grupoSubgrupo === grupoFilterCombined;
            const matchCla = !classeFilterCombined || item.classe === classeFilterCombined;
            matchGrupoClasse = matchGrp && matchCla;
        }

        const matchStockToggle = !onlyInStock || (item.estoqEmb1 > 0 || item.estoqEmb9 > 0);
        const matchPendingToggle = !onlyPendingOrders || (item.pedidosPendentes > 0);

        return matchSearch && matchEmbalagem && matchComprador && matchFornec && matchSta && matchDiversificado && matchGrupoClasse && matchStockToggle && matchPendingToggle;
    });

    applySort();
    renderUI();
}

function renderUI() {
    elements.kpiTotalSkus.textContent = state.filteredData.length.toLocaleString('pt-BR');
    
    const totalValorEstoque = state.filteredData.reduce((sum, item) => sum + item.valorEstoqueTotal, 0);
    elements.kpiValorEstoqueTotal.textContent = totalValorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    elements.kpiWarning.textContent = state.filteredData.filter(i => i.riskLevel === 'warning').length.toLocaleString('pt-BR');
    elements.kpiCritical.textContent = state.filteredData.filter(i => i.riskLevel === 'critical').length.toLocaleString('pt-BR');

    const totalVendaAnterior = state.filteredData.reduce((sum, item) => sum + item.vendaAnterior, 0);
    const totalVendaAtual = state.filteredData.reduce((sum, item) => sum + item.vendaAtual, 0);
    const totalDiferenca = totalVendaAtual - totalVendaAnterior;

    let totalPctEvolucao = 0;
    if (totalVendaAnterior > 0) {
        totalPctEvolucao = (totalDiferenca / totalVendaAnterior) * 100;
    } else if (totalVendaAtual > 0) {
        totalPctEvolucao = 100;
    }

    elements.kpiVendaAnteriorTotal.textContent = totalVendaAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    elements.kpiVendaAtualTotal.textContent = totalVendaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const difFormatted = `${totalDiferenca >= 0 ? '+' : ''}${totalDiferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    elements.kpiDiferencaVendasTotal.textContent = difFormatted;
    elements.kpiDiferencaVendasTotal.style.color = totalDiferenca < 0 ? 'var(--status-critical)' : 'var(--status-success)';

    const pctFormatted = `${totalPctEvolucao >= 0 ? '+' : ''}${totalPctEvolucao.toFixed(2)}%`;
    elements.kpiPctEvolucaoTotal.textContent = pctFormatted;
    elements.kpiPctEvolucaoTotal.style.color = totalPctEvolucao < 0 ? 'var(--status-critical)' : 'var(--status-success)';

    const total = state.filteredData.length;
    const maxPages = Math.ceil(total / state.pageSize) || 1;
    if (state.currentPage > maxPages) state.currentPage = maxPages;

    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = Math.min(startIdx + state.pageSize, total);
    const pageItems = state.filteredData.slice(startIdx, endIdx);

    elements.pageInfo.textContent = `Exibindo ${total === 0 ? 0 : startIdx + 1} até ${endIdx} de ${total.toLocaleString('pt-BR')} SKUs`;
    elements.currentPageNum.textContent = `Pág ${state.currentPage} / ${maxPages}`;
    elements.btnPrevPage.disabled = state.currentPage <= 1;
    elements.btnNextPage.disabled = state.currentPage >= maxPages;

    if (state.activeTab === 'tab-dashboard') {
        renderDashboardTable(pageItems);
    } else if (state.activeTab === 'tab-sales') {
        renderSalesTable(pageItems);
    }
}

function renderDashboardTable(pageItems) {
    if (pageItems.length === 0) {
        elements.tableBody.innerHTML = `<tr><td colspan="27" class="empty-state">Nenhum produto encontrado para os filtros selecionados.</td></tr>`;
        syncColumnVisibility();
        return;
    }

    elements.tableBody.innerHTML = pageItems.map(item => {
        let txtAutonomia = 'S/ Venda';
        if (item.venda30Dias > 0) {
            txtAutonomia = `${Math.round(item.autonomiaDias)}d`;
        }

        let rentClass = 'badge-success';
        if (item.rentabilidade < 0) {
            rentClass = 'badge-danger';
        } else if (item.rentabilidade <= 4.5) {
            rentClass = 'badge-warning';
        }

        const isAtivo = item.sta === 'Ativo' || item.sta === ' ' || item.sta === 'N/A';
        const staBadgeClass = isAtivo ? 'badge-sta' : 'badge-inativo';

        let riskBadgeClass = 'badge-normal';
        if (item.diasSemVenda > 6) {
            riskBadgeClass = 'badge-critical';
        } else if (item.diasSemVenda > 2) {
            riskBadgeClass = 'badge-warning';
        }

        const idadeInt = Math.round(item.idade);
        const idadeBadgeClass = idadeInt > 80 ? 'badge badge-idade-critical' : '';

        return `
        <tr>
            <td>
                <strong>${item.descricao}</strong>
                <span class="sub-text">Cód: ${item.codigoCompleto}</span>
            </td>
            <td class="col-embalagem">${item.embalagem}</td>
            <td class="col-estoque">
                <strong>${item.estoqEmb1.toLocaleString('pt-BR')} CX</strong>
                <span class="sub-text">${item.estoqEmb9.toLocaleString('pt-BR')} UN</span>
            </td>
            <td class="col-valorEstoque">
                <strong>${item.valorEstoqueTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </td>
            <td class="col-precoCx">R$ ${item.precoVenda.toFixed(2)}</td>
            <td class="col-precoUnd">R$ ${item.precoUnidade.toFixed(2)}</td>
            <td class="col-idade"><span class="${idadeBadgeClass}">${idadeInt} d</span></td>
            <td class="col-dias"><span class="badge ${riskBadgeClass}">${item.diasSemVenda} d</span></td>
            <td class="col-autonomia">${txtAutonomia}</td>
            <td class="col-rentabilidade"><span class="badge ${rentClass}">${item.rentabilidade.toFixed(2)}%</span></td>
            <td class="col-fornecedor">
                <span class="badge badge-fornecedor" onclick="filterByFornecedor('${item.fornecedorFormatted}')" title="Filtrar fornecedor">
                    ${item.fornecedorFormatted}
                </span>
            </td>
            <td class="col-pedidos">${item.pedidosPendentes.toLocaleString('pt-BR')}</td>
            <td class="col-sta"><span class="badge ${staBadgeClass}">${item.sta}</span></td>

            <td class="col-comprador">${item.comprador}</td>
            <td class="col-venda30Dias">${item.venda30Dias.toLocaleString('pt-BR')}</td>
            <td class="col-grupo">${item.grupo} / ${item.subgrupo}</td>
            <td class="col-classe">${item.classe}</td>
            <td class="col-digito">${item.digito}</td>
            <td class="col-qtdIdeal">${item.qtdIdeal.toLocaleString('pt-BR')}</td>
            <td class="col-dtUltEnt">${item.dtUltEnt}</td>
            <td class="col-qtdUltEnt">${item.qtdUltEnt.toLocaleString('pt-BR')}</td>
            <td class="col-bloq1">${item.bloq1}</td>
            <td class="col-bloq9">${item.bloq9}</td>
            <td class="col-prFixo">${item.prFixo}</td>
            <td class="col-pedFornec">${item.pedFornec.toLocaleString('pt-BR')}</td>
            <td class="col-pedFilial">${item.pedFilial.toLocaleString('pt-BR')}</td>
            <td class="col-pedFat">${item.pedFat.toLocaleString('pt-BR')}</td>
        </tr>
    `}).join('');

    syncColumnVisibility();
}

function renderSalesTable(pageItems) {
    if (pageItems.length === 0) {
        elements.salesTableBody.innerHTML = `<tr><td colspan="18" class="empty-state">Nenhum produto encontrado.</td></tr>`;
        return;
    }

    elements.salesTableBody.innerHTML = pageItems.map(item => {
        let rentClass = 'badge-success';
        if (item.rentabilidade < 0) {
            rentClass = 'badge-danger';
        } else if (item.rentabilidade <= 4.5) {
            rentClass = 'badge-warning';
        }

        const isRegressao = item.diferencaVendas < 0;
        const colorStyle = isRegressao ? 'color: var(--status-critical); font-weight: 700;' : 'color: var(--status-success); font-weight: 700;';
        const sinalDif = item.diferencaVendas > 0 ? '+' : '';
        const sinalPct = item.pctEvolucao > 0 ? '+' : '';

        const isAtivo = item.sta === 'Ativo' || item.sta === ' ' || item.sta === 'N/A';
        const staBadgeClass = isAtivo ? 'badge-sta' : 'badge-inativo';

        let txtAutonomia = 'S/ Venda';
        if (item.venda30Dias > 0) {
            txtAutonomia = `${Math.round(item.autonomiaDias)} d`;
        }

        return `
        <tr>
            <td>
                <strong>${item.descricao}</strong>
                <span class="sub-text">Cód: ${item.codigoCompleto}</span>
            </td>
            <td>${item.embalagem}</td>
            <td>
                <strong>${item.estoqEmb1.toLocaleString('pt-BR')} CX</strong>
                <span class="sub-text">${item.estoqEmb9.toLocaleString('pt-BR')} UN</span>
            </td>
            <td><strong>${item.valorEstoqueTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
            <td>
                <span class="badge badge-fornecedor" onclick="filterByFornecedor('${item.fornecedorFormatted}')" title="Filtrar fornecedor">
                    ${item.fornecedorFormatted}
                </span>
            </td>
            <td><span class="badge ${rentClass}">${item.rentabilidade.toFixed(2)}%</span></td>
            <td><strong>${item.vendaAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
            <td><strong>${item.vendaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
            <td style="${colorStyle}">${sinalDif}${item.diferencaVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td style="${colorStyle}">${sinalPct}${item.pctEvolucao.toFixed(2)}%</td>
            <td>${item.comprador}</td>
            <td><span class="badge ${staBadgeClass}">${item.sta}</span></td>
            <td>${item.grupo} / ${item.subgrupo}</td>
            <td>${item.classe}</td>
            <td>${item.diasSemVenda} d</td>
            <td>${txtAutonomia}</td>
            <td>${Math.round(item.idade)} d</td>
            <td>${item.pedidosPendentes.toLocaleString('pt-BR')}</td>
        </tr>
    `}).join('');
}

// AGREGADORES
function aggregateDataByKey(keyField, unitType = 'currency') {
    const map = new Map();

    state.rawProcessedData.forEach(item => {
        let key = item[keyField] || 'N/A';
        if (key === 'N/A' || key === 'N/A / N/A' || key.trim() === '') return;

        if (!map.has(key)) {
            map.set(key, {
                name: key,
                vendaAnterior: 0,
                vendaAtual: 0,
                valorEstoqueTotal: 0,
                rentabilidadeSum: 0,
                itemsCount: 0,
                grupo: item.grupo || ''
            });
        }

        const entry = map.get(key);
        
        const valAnt = unitType === 'quantity' ? item.qtdAnterior : item.vendaAnterior;
        const valAtu = unitType === 'quantity' ? item.qtdAtual : item.vendaAtual;

        entry.vendaAnterior += valAnt;
        entry.vendaAtual += valAtu;
        entry.valorEstoqueTotal += item.valorEstoqueTotal;
        entry.rentabilidadeSum += item.rentabilidade;
        entry.itemsCount += 1;
    });

    return Array.from(map.values()).map(e => {
        const dif = e.vendaAtual - e.vendaAnterior;
        let pct = 0;
        if (e.vendaAnterior > 0) {
            pct = (dif / e.vendaAnterior) * 100;
        } else if (e.vendaAtual > 0) {
            pct = 100;
        }

        const rentabilidadeMedia = e.itemsCount > 0 ? (e.rentabilidadeSum / e.itemsCount) : 0;

        return {
            ...e,
            diferencaVendas: dif,
            pctEvolucao: pct,
            rentabilidadeMedia: rentabilidadeMedia
        };
    });
}

// AGREGADOR STATUS FL POR COMPRADOR
function aggregateStatusFlByComprador() {
    const map = new Map();

    state.rawProcessedData.forEach(item => {
        if (item.sta && item.sta.toUpperCase().trim() === 'FL') {
            const comp = item.comprador || 'N/A';
            if (comp === 'N/A') return;

            if (!map.has(comp)) {
                map.set(comp, {
                    name: comp,
                    valorEstoqueFl: 0,
                    qtdSkusFl: 0
                });
            }

            const entry = map.get(comp);
            entry.valorEstoqueFl += item.valorEstoqueTotal || 0;
            entry.qtdSkusFl += 1;
        }
    });

    return Array.from(map.values()).sort((a, b) => b.valorEstoqueFl - a.valorEstoqueFl);
}

// AGREGADOR STATUS ISV POR COMPRADOR
function aggregateStatusIsvByComprador() {
    const map = new Map();
    const minIdade = state.isvParams.minIdade ?? 7;
    const minDias = state.isvParams.minDiasSemVenda ?? 7;

    state.rawProcessedData.forEach(item => {
        if (item.idade > minIdade && item.diasSemVenda > minDias) {
            const comp = item.comprador || 'N/A';
            if (comp === 'N/A') return;

            if (!map.has(comp)) {
                map.set(comp, {
                    name: comp,
                    valorEstoqueIsv: 0,
                    qtdSkusIsv: 0
                });
            }

            const entry = map.get(comp);
            entry.valorEstoqueIsv += item.valorEstoqueTotal || 0;
            entry.qtdSkusIsv += 1;
        }
    });

    return Array.from(map.values()).sort((a, b) => b.valorEstoqueIsv - a.valorEstoqueIsv);
}

// AGREGADOR BAIXO GIRO (>90 DIAS) POR COMPRADOR
function aggregateBaixoGiroByComprador() {
    const map = new Map();

    state.rawProcessedData.forEach(item => {
        if (item.idade > 90) {
            const comp = item.comprador || 'N/A';
            if (comp === 'N/A') return;

            if (!map.has(comp)) {
                map.set(comp, {
                    name: comp,
                    valorEstoqueBaixoGiro: 0,
                    qtdSkusBaixoGiro: 0
                });
            }

            const entry = map.get(comp);
            entry.valorEstoqueBaixoGiro += item.valorEstoqueTotal || 0;
            entry.qtdSkusBaixoGiro += 1;
        }
    });

    return Array.from(map.values()).sort((a, b) => b.valorEstoqueBaixoGiro - a.valorEstoqueBaixoGiro);
}

function sortAggregatedData(dataArray, metricKey, sortOrder) {
    const mult = sortOrder === 'asc' ? 1 : -1;
    return [...dataArray].sort((a, b) => {
        let valA = a[metricKey] ?? '';
        let valB = b[metricKey] ?? '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * mult;
        }
        return String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true, sensitivity: 'base' }) * mult;
    });
}

// DRILL-DOWN PARA A ABA DASHBOARD
function drillDownToDashboard(type, buyerValue, extraFilters = {}) {
    switchTab('tab-dashboard');

    elements.globalSearch.value = '';
    elements.searchEmbalagem.value = '';
    
    if (elements.filterComprador) elements.filterComprador.value = buyerValue || '';
    if (elements.filterFornecedor) elements.filterFornecedor.value = '';
    if (elements.filterGrupo) elements.filterGrupo.value = '';
    updateClasseOptionsDashboard();
    if (elements.filterClasse) elements.filterClasse.value = '';

    if (extraFilters.sta) {
        if (elements.filterSta) {
            let matchedValue = extraFilters.sta;
            Array.from(elements.filterSta.options).forEach(opt => {
                if (opt.value.toUpperCase().trim() === extraFilters.sta.toUpperCase().trim()) {
                    matchedValue = opt.value;
                }
            });
            elements.filterSta.value = matchedValue;
        }
    } else {
        if (elements.filterSta) elements.filterSta.value = '';
    }

    if (extraFilters.diversificado) {
        elements.filterDiversificado.value = extraFilters.diversificado;
        state.activeDiversificadoFilter = extraFilters.diversificado;
        if (extraFilters.diversificadoParams) {
            state.diversificadoParams = extraFilters.diversificadoParams;
        }
    } else {
        elements.filterDiversificado.value = '';
        state.activeDiversificadoFilter = null;
    }

    state.currentPage = 1;
    applyFilters();
}

// DRILL-DOWN PARA A ABA DE VENDAS
function drillDownToSales(type, value) {
    switchTab('tab-sales');

    state.activeAbcBuyers = null;
    if (elements.filterCompradorSales) elements.filterCompradorSales.value = '';
    if (elements.filterGrupoSales) elements.filterGrupoSales.value = '';
    if (elements.filterSubgrupoSales) elements.filterSubgrupoSales.value = '';
    if (elements.filterClasseSales) elements.filterClasseSales.value = '';

    if (type === 'comprador') {
        if (elements.filterCompradorSales) elements.filterCompradorSales.value = value;
    } else if (type === 'grupo') {
        if (elements.filterGrupoSales) elements.filterGrupoSales.value = value;
        updateSubgrupoSalesOptions();
        updateClasseSalesOptions();
    } else if (type === 'subgrupo') {
        const found = state.rawProcessedData.find(i => i.subgrupo === value);
        if (found && found.grupo && elements.filterGrupoSales) {
            elements.filterGrupoSales.value = found.grupo;
            updateSubgrupoSalesOptions();
        }
        if (elements.filterSubgrupoSales) elements.filterSubgrupoSales.value = value;
        updateClasseSalesOptions();
    } else if (type === 'fornecedor') {
        if (elements.filterFornecedor) elements.filterFornecedor.value = value;
    }

    state.currentPage = 1;
    applyFilters();
}

function drillDownAbcToSales(buyersList) {
    if (!buyersList || buyersList.length === 0) return;

    state.activeAbcBuyers = buyersList;
    switchTab('tab-sales');

    if (elements.filterCompradorSales) elements.filterCompradorSales.value = '';
    if (elements.filterGrupoSales) elements.filterGrupoSales.value = '';
    if (elements.filterSubgrupoSales) elements.filterSubgrupoSales.value = '';
    if (elements.filterClasseSales) elements.filterClasseSales.value = '';

    state.currentPage = 1;
    applyFilters();
}

function renderChartsTab() {
    const totalVendaAnterior = state.rawProcessedData.reduce((sum, item) => sum + item.vendaAnterior, 0);
    const totalVendaAtual = state.rawProcessedData.reduce((sum, item) => sum + item.vendaAtual, 0);
    const totalDiferenca = totalVendaAtual - totalVendaAnterior;

    let totalPctEvolucao = 0;
    if (totalVendaAnterior > 0) {
        totalPctEvolucao = (totalDiferenca / totalVendaAnterior) * 100;
    } else if (totalVendaAtual > 0) {
        totalPctEvolucao = 100;
    }

    if (elements.kpiChartsVendaAnterior) {
        elements.kpiChartsVendaAnterior.textContent = totalVendaAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (elements.kpiChartsVendaAtual) {
        elements.kpiChartsVendaAtual.textContent = totalVendaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (elements.kpiChartsDiferencaVendas) {
        const difFormatted = `${totalDiferenca >= 0 ? '+' : ''}${totalDiferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        elements.kpiChartsDiferencaVendas.textContent = difFormatted;
        elements.kpiChartsDiferencaVendas.style.color = totalDiferenca < 0 ? 'var(--status-critical)' : 'var(--status-success)';
    }
    if (elements.kpiChartsPctEvolucao) {
        const pctFormatted = `${totalPctEvolucao >= 0 ? '+' : ''}${totalPctEvolucao.toFixed(2)}%`;
        elements.kpiChartsPctEvolucao.textContent = pctFormatted;
        elements.kpiChartsPctEvolucao.style.color = totalPctEvolucao < 0 ? 'var(--status-critical)' : 'var(--status-success)';
    }

    const unitType = elements.chartUnitType ? elements.chartUnitType.value : 'currency';
    const limit = elements.chartLimit ? Number(elements.chartLimit.value) : 10;

    let compradoresAggRaw = aggregateDataByKey('comprador', unitType);
    let gruposAggRaw = aggregateDataByKey('grupo', unitType);
    let subgruposAggRaw = aggregateDataByKey('subgrupo', unitType);
    let fornecedoresAggRaw = aggregateDataByKey('fornecedorFormatted', unitType);
    
    let statusFlAggRaw = aggregateStatusFlByComprador();
    let statusIsvAggRaw = aggregateStatusIsvByComprador();
    let baixoGiroAggRaw = aggregateBaixoGiroByComprador();

    let compradoresAgg = sortAggregatedData(compradoresAggRaw, state.rankingSorts.compradores.key, state.rankingSorts.compradores.direction);
    let gruposAgg = sortAggregatedData(gruposAggRaw, state.rankingSorts.grupos.key, state.rankingSorts.grupos.direction);
    let subgruposAgg = sortAggregatedData(subgruposAggRaw, state.rankingSorts.subgrupos.key, state.rankingSorts.subgrupos.direction);
    let fornecedoresAgg = sortAggregatedData(fornecedoresAggRaw, 'vendaAtual', 'desc');

    renderRankingTable(elements.rankingCompradoresBody, compradoresAgg, 'comprador', unitType);
    renderRankingTable(elements.rankingGruposBody, gruposAgg, 'grupo', unitType);
    renderRankingTable(elements.rankingSubgruposBody, subgruposAgg, 'subgrupo', unitType);

    updateRankingHeaderIcons();

    let compradoresLimited = limit > 0 ? compradoresAgg.slice(0, limit) : compradoresAgg;
    let gruposLimited = limit > 0 ? gruposAgg.slice(0, limit) : gruposAgg;
    let subgruposLimited = limit > 0 ? subgruposAgg.slice(0, limit) : subgruposAgg;
    let fornecedoresLimited = limit > 0 ? fornecedoresAgg.slice(0, limit) : fornecedoresAgg;

    let statusFlLimited = limit > 0 ? statusFlAggRaw.slice(0, limit) : statusFlAggRaw;
    let statusIsvLimited = limit > 0 ? statusIsvAggRaw.slice(0, limit) : statusIsvAggRaw;
    let baixoGiroLimited = limit > 0 ? baixoGiroAggRaw.slice(0, limit) : baixoGiroAggRaw;

    renderCompradoresChart(compradoresLimited, unitType);
    renderStatusFlChart(statusFlLimited);
    renderStatusIsvChart(statusIsvLimited);
    renderBaixoGiroChart(baixoGiroLimited);
    renderGruposChart(gruposLimited, unitType);
    renderParetoChart(compradoresAggRaw, unitType);
    renderEstoqueVendasChart(gruposLimited, unitType);
    renderFornecedoresChart(fornecedoresLimited, unitType);
    renderSubgruposChart(subgruposLimited, unitType);

    syncChartVisibility();
    initDragAndDrop();
}

function formatChartValue(val, unitType) {
    if (unitType === 'quantity') return val.toLocaleString('pt-BR') + ' CX';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderRankingTable(containerEl, dataArray, type, unitType) {
    if (!containerEl) return;

    if (!dataArray || dataArray.length === 0) {
        containerEl.innerHTML = `<tr><td colspan="6" class="empty-state">Sem dados.</td></tr>`;
        return;
    }

    containerEl.innerHTML = dataArray.map(item => {
        const isNeg = item.diferencaVendas < 0;
        const colorStyle = isNeg ? 'color: var(--status-critical); font-weight:700;' : 'color: var(--status-success); font-weight:700;';
        const sinalDif = item.diferencaVendas > 0 ? '+' : '';
        const sinalPct = item.pctEvolucao > 0 ? '+' : '';
        const nameEscaped = item.name.replace(/'/g, "\\'");

        if (type === 'subgrupo') {
            return `
            <tr>
                <td title="${item.name}"><strong>${item.name}</strong></td>
                <td title="${item.grupo}"><span class="sub-text">${item.grupo}</span></td>
                <td><strong>${formatChartValue(item.vendaAtual, unitType)}</strong></td>
                <td style="${colorStyle}">${sinalDif}${formatChartValue(item.diferencaVendas, unitType)}</td>
                <td style="${colorStyle}">${sinalPct}${item.pctEvolucao.toFixed(1)}%</td>
                <td>
                    <button class="btn-action-filter" onclick="drillDownToSales('${type}', '${nameEscaped}')" title="Filtrar na aba de Vendas">🔍</button>
                </td>
            </tr>
            `;
        }

        return `
        <tr>
            <td title="${item.name}"><strong>${item.name}</strong></td>
            <td>${formatChartValue(item.vendaAnterior, unitType)}</td>
            <td><strong>${formatChartValue(item.vendaAtual, unitType)}</strong></td>
            <td style="${colorStyle}">${sinalDif}${formatChartValue(item.diferencaVendas, unitType)}</td>
            <td style="${colorStyle}">${sinalPct}${item.pctEvolucao.toFixed(1)}%</td>
            <td>
                <button class="btn-action-filter" onclick="drillDownToSales('${type}', '${nameEscaped}')" title="Filtrar na aba de Vendas">🔍</button>
            </td>
        </tr>
        `;
    }).join('');
}

// COMPRADORES: VELAS HORIZONTAIS
function renderCompradoresChart(data, unitType) {
    const ctx = document.getElementById('chartCompradores');
    if (!ctx) return;

    if (chartCompradoresInstance) chartCompradoresInstance.destroy();

    const labels = data.map(i => i.name);
    const datasetAnt = data.map(i => i.vendaAnterior);
    const datasetAtu = data.map(i => i.vendaAtual);

    chartCompradoresInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Venda Anterior', data: datasetAnt, backgroundColor: '#f97316', borderRadius: 3 },
                { label: 'Venda Atual', data: datasetAtu, backgroundColor: '#22c55e', borderRadius: 3 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    drillDownToSales('comprador', labels[activeEls[0].index]);
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatChartValue(ctx.raw, unitType)}` } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#f8fafc', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// STATUS FL POR COMPRADOR (REDIRECIONA PARA DASHBOARD COM COMPRADOR + STA FL)
function renderStatusFlChart(data) {
    const ctx = document.getElementById('chartStatusFl');
    if (!ctx) return;

    if (chartStatusFlInstance) chartStatusFlInstance.destroy();

    const labels = data.map(i => i.name);
    const valuesR$ = data.map(i => i.valorEstoqueFl);
    const qtdSkus = data.map(i => i.qtdSkusFl);

    chartStatusFlInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor FL (R$)',
                    data: valuesR$,
                    backgroundColor: '#c2410c',
                    borderRadius: 3
                },
                {
                    label: 'Qtd SKUs FL',
                    data: qtdSkus,
                    backgroundColor: '#ea580c',
                    borderRadius: 3
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const idx = activeEls[0].index;
                    drillDownToDashboard('comprador', labels[idx], { sta: 'FL' });
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) {
                                return `Valor FL: ${ctx.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                            }
                            return `Quantidade SKUs: ${ctx.raw} UN`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#f8fafc', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// STATUS ISV POR COMPRADOR (REDIRECIONA PARA DASHBOARD COM COMPRADOR + ISV)
function renderStatusIsvChart(data) {
    const ctx = document.getElementById('chartStatusIsv');
    if (!ctx) return;

    if (chartStatusIsvInstance) chartStatusIsvInstance.destroy();

    const labels = data.map(i => i.name);
    const valuesR$ = data.map(i => i.valorEstoqueIsv);
    const qtdSkus = data.map(i => i.qtdSkusIsv);

    chartStatusIsvInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor ISV (R$)',
                    data: valuesR$,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 3
                },
                {
                    label: 'Qtd SKUs ISV',
                    data: qtdSkus,
                    backgroundColor: '#a78bfa',
                    borderRadius: 3
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const idx = activeEls[0].index;
                    drillDownToDashboard('comprador', labels[idx], { diversificado: 'isv' });
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) {
                                return `Valor ISV: ${ctx.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                            }
                            return `Qtd SKUs ISV: ${ctx.raw} UN`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#f8fafc', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// BAIXO GIRO (>90 DIAS) POR COMPRADOR (REDIRECIONA PARA DASHBOARD)
function renderBaixoGiroChart(data) {
    const ctx = document.getElementById('chartBaixoGiro');
    if (!ctx) return;

    if (chartBaixoGiroInstance) chartBaixoGiroInstance.destroy();

    const labels = data.map(i => i.name);
    const valuesR$ = data.map(i => i.valorEstoqueBaixoGiro);
    const qtdSkus = data.map(i => i.qtdSkusBaixoGiro);

    chartBaixoGiroInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor >90d (R$)',
                    data: valuesR$,
                    backgroundColor: '#e11d48',
                    borderRadius: 3
                },
                {
                    label: 'Qtd SKUs >90d',
                    data: qtdSkus,
                    backgroundColor: '#f43f5e',
                    borderRadius: 3
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const idx = activeEls[0].index;
                    drillDownToDashboard('comprador', labels[idx], { diversificado: 'baixo_giro' });
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) {
                                return `Valor (>90d): ${ctx.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                            }
                            return `Qtd SKUs (>90d): ${ctx.raw} UN`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#f8fafc', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// GRUPOS: VELAS VERTICAIS DUPLAS
function renderGruposChart(data, unitType) {
    const ctx = document.getElementById('chartGrupos');
    if (!ctx) return;

    if (chartGruposInstance) chartGruposInstance.destroy();

    const labels = data.map(i => i.name);
    const datasetAnt = data.map(i => i.vendaAnterior);
    const datasetAtu = data.map(i => i.vendaAtual);

    chartGruposInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Venda Anterior', data: datasetAnt, backgroundColor: '#f97316', borderRadius: 3 },
                { label: 'Venda Atual', data: datasetAtu, backgroundColor: '#22c55e', borderRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    drillDownToSales('grupo', labels[activeEls[0].index]);
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9, weight: 'bold' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatChartValue(ctx.raw, unitType)}`,
                        footer: (tooltipItems) => {
                            if (!tooltipItems.length) return '';
                            const idx = tooltipItems[0].dataIndex;
                            const item = data[idx];
                            if (!item) return '';
                            const dif = item.diferencaVendas;
                            const pct = item.pctEvolucao;
                            const sinal = dif < 0 ? '' : '+';
                            return `--------------------\nDiferença: ${sinal}${formatChartValue(dif, unitType)} (${sinal}${pct.toFixed(2)}%)`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#f8fafc', font: { size: 8 }, maxRotation: 45, minRotation: 45 }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// SUBGRUPOS: VELAS HORIZONTAIS DUPLAS
function renderSubgruposChart(data, unitType) {
    const ctx = document.getElementById('chartSubgrupos');
    if (!ctx) return;

    if (chartSubgruposInstance) chartSubgruposInstance.destroy();

    const fullNames = data.map(i => i.name);
    const labels = data.map(i => `${i.name} (${i.grupo})`);
    const datasetAnt = data.map(i => i.vendaAnterior);
    const datasetAtu = data.map(i => i.vendaAtual);

    chartSubgruposInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Venda Anterior', data: datasetAnt, backgroundColor: '#f97316', borderRadius: 3 },
                { label: 'Venda Atual', data: datasetAtu, backgroundColor: '#22c55e', borderRadius: 3 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const idx = activeEls[0].index;
                    drillDownToSales('subgrupo', fullNames[idx]);
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9, weight: 'bold' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatChartValue(ctx.raw, unitType)}`,
                        footer: (tooltipItems) => {
                            if (!tooltipItems.length) return '';
                            const idx = tooltipItems[0].dataIndex;
                            const item = data[idx];
                            if (!item) return '';
                            const dif = item.diferencaVendas;
                            const pct = item.pctEvolucao;
                            const sinal = dif < 0 ? '' : '+';
                            return `--------------------\nDiferença: ${sinal}${formatChartValue(dif, unitType)} (${sinal}${pct.toFixed(2)}%)`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#f8fafc', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// PARETO: DOUGHNUT
function renderParetoChart(allCompradoresData, unitType) {
    const ctx = document.getElementById('chartPareto');
    if (!ctx) return;

    if (chartParetoInstance) chartParetoInstance.destroy();

    const sortedBySales = [...allCompradoresData].sort((a, b) => b.vendaAtual - a.vendaAtual);
    const totalSales = sortedBySales.reduce((sum, i) => sum + i.vendaAtual, 0);

    let accumulated = 0;
    let classeA = 0, classeB = 0, classeC = 0;
    const buyersA = [], buyersB = [], buyersC = [];

    sortedBySales.forEach(item => {
        accumulated += item.vendaAtual;
        const pctAccumulated = totalSales > 0 ? (accumulated / totalSales) * 100 : 100;

        if (pctAccumulated <= 80) {
            classeA += item.vendaAtual;
            buyersA.push(item.name);
        } else if (pctAccumulated <= 95) {
            classeB += item.vendaAtual;
            buyersB.push(item.name);
        } else {
            classeC += item.vendaAtual;
            buyersC.push(item.name);
        }
    });

    const abcBuyersMap = [buyersA, buyersB, buyersC];

    chartParetoInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Classe A (80%)', 'Classe B (15%)', 'Classe C (5%)'],
            datasets: [{
                data: [classeA, classeB, classeC],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderWidth: 2,
                borderColor: '#131d31'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const idx = activeEls[0].index;
                    drillDownAbcToSales(abcBuyersMap[idx]);
                }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.raw;
                            const pct = totalSales > 0 ? ((val / totalSales) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${formatChartValue(val, unitType)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// CAPITAL EMPATADO
function renderEstoqueVendasChart(data, unitType) {
    const ctx = document.getElementById('chartEstoqueVendas');
    if (!ctx) return;

    if (chartEstoqueVendasInstance) chartEstoqueVendasInstance.destroy();

    const labels = data.map(i => i.name);
    const datasetEstoque = data.map(i => i.valorEstoqueTotal);
    const datasetVendas = data.map(i => i.vendaAtual);

    chartEstoqueVendasInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Valor em Estoque (R$)', data: datasetEstoque, backgroundColor: '#f97316', borderRadius: 3 },
                { label: 'Venda do Período', data: datasetVendas, backgroundColor: '#22c55e', borderRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    drillDownToSales('grupo', labels[activeEls[0].index]);
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatChartValue(ctx.raw, unitType)}` } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 }, maxRotation: 45, minRotation: 45 }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// EVOLUÇÃO DOS FORNECEDORES (AZUL PARA ATUAL E VERMELHO PARA ANTERIOR)
function renderFornecedoresChart(data, unitType) {
    const ctx = document.getElementById('chartFornecedores');
    if (!ctx) return;

    if (chartFornecedoresInstance) chartFornecedoresInstance.destroy();

    const fullNames = data.map(i => i.name);
    const labels = data.map(i => i.name.length > 25 ? i.name.slice(0, 25) + '...' : i.name);
    const datasetAnt = data.map(i => i.vendaAnterior);
    const datasetAtu = data.map(i => i.vendaAtual);

    chartFornecedoresInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'Venda Anterior', 
                    data: datasetAnt, 
                    backgroundColor: '#ef4444',
                    borderRadius: 3 
                },
                { 
                    label: 'Venda Atual', 
                    data: datasetAtu, 
                    backgroundColor: '#38bdf8',
                    borderRadius: 3 
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const idx = activeEls[0].index;
                    drillDownToSales('fornecedor', fullNames[idx]);
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 9 } } },
                tooltip: { 
                    callbacks: { 
                        label: (ctx) => `${ctx.dataset.label}: ${formatChartValue(ctx.raw, unitType)}`,
                        footer: (tooltipItems) => {
                            if (!tooltipItems.length) return '';
                            const idx = tooltipItems[0].dataIndex;
                            const item = data[idx];
                            if (!item) return '';
                            const dif = item.diferencaVendas;
                            const pct = item.pctEvolucao;
                            const sinal = dif < 0 ? '' : '+';
                            return `--------------------\nDiferença: ${sinal}${formatChartValue(dif, unitType)} (${sinal}${pct.toFixed(2)}%)`;
                        }
                    } 
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 8 } }, grid: { color: '#26334d' } },
                y: { ticks: { color: '#f8fafc', font: { size: 8 } }, grid: { color: '#26334d' } }
            }
        }
    });
}

// PDF EXECUTIVO MULTI-PÁGINAS
function exportExecutivePdf() {
    if (!state.rawProcessedData.length) {
        alert("Não há dados carregados para gerar o PDF Executivo.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR');

    function drawPageHeader() {
        doc.setFillColor(11, 17, 32);
        doc.rect(0, 0, 297, 210, 'F');

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(248, 250, 252);
        doc.text("StockAnalytics - DASHBOARD EXECUTIVO DE VENDAS", 10, 12);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Relatório Gerencial Sintético | Gerado em: ${dateFormatted} às ${timeFormatted}`, 10, 17);

        const totalVendaAnterior = state.rawProcessedData.reduce((sum, item) => sum + item.vendaAnterior, 0);
        const totalVendaAtual = state.rawProcessedData.reduce((sum, item) => sum + item.vendaAtual, 0);
        const totalDiferenca = totalVendaAtual - totalVendaAnterior;

        doc.setFontSize(9);
        doc.setTextColor(56, 189, 248);
        doc.text(`Venda Anterior: ${totalVendaAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 10, 24);
        doc.text(`Venda Atual: ${totalVendaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 105, 24);
        doc.text(`Diferença: ${totalDiferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 200, 24);
    }

    function drawPageFooter() {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("StockAnalytics ERP Intelligence - Documento Gerencial Interno", 10, 204);
    }

    drawPageHeader();

    const canvasList = [
        { id: 'chartCompradores', title: 'Compradores' },
        { id: 'chartStatusFl', title: 'Status FL' },
        { id: 'chartStatusIsv', title: 'Status ISV' },
        { id: 'chartBaixoGiro', title: 'Baixo Giro' },
        { id: 'chartPareto', title: 'Curva ABC' },
        { id: 'chartGrupos', title: 'Grupos' },
        { id: 'chartSubgrupos', title: 'Subgrupos' },
        { id: 'chartEstoqueVendas', title: 'Capital Empatado' },
        { id: 'chartFornecedores', title: 'Evolução Fornecedores' }
    ];

    let itemsOnCurrentPage = 0;

    canvasList.forEach((item) => {
        const canvas = document.getElementById(item.id);
        if (!canvas) return;

        if (itemsOnCurrentPage > 0 && itemsOnCurrentPage % 4 === 0) {
            drawPageFooter();
            doc.addPage();
            drawPageHeader();
            itemsOnCurrentPage = 0;
        }

        const posOnPage = itemsOnCurrentPage % 4;
        const row = Math.floor(posOnPage / 2);
        const col = posOnPage % 2;

        const x = col === 0 ? 10 : 150;
        const y = 30 + (row * 82);

        try {
            const imgData = canvas.toDataURL('image/png', 1.0);
            doc.setDrawColor(38, 51, 77);
            doc.setFillColor(19, 29, 49);
            doc.roundedRect(x, y, 137, 78, 2, 2, 'FD');
            doc.addImage(imgData, 'PNG', x + 2, y + 2, 133, 74);
            itemsOnCurrentPage++;
        } catch (e) {
            console.error("Erro ao incluir gráfico no PDF Executivo:", e);
        }
    });

    drawPageFooter();

    doc.save(`Dashboard_Executivo_Vendas_${dateFormatted.replace(/\//g, '-')}.pdf`);
}

function exportToPDF(type) {
    elements.dropdownPdf.classList.add('hidden');
    if (!state.filteredData.length) {
        alert("Não há dados filtrados para gerar o relatório em PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const isDetailed = type === 'detailed';
    const titleText = isDetailed ? "RELATÓRIO DETALHADO DE ESTOQUE" : "RELATÓRIO SIMPLES DE ESTOQUE";

    let headers = isDetailed ? [
        ["Produto + Código", "Emb.", "Estoque", "Val. Estoque", "Ped. Pend.", "Rent. (%)", "Dt Entrada", "Qtd Ent.", "Idade", "Dias s/ Vnd", "Status", "Comprador"]
    ] : [
        ["Produto + Código", "Emb.", "Estoque", "Dt Entrada", "Qtd Entrada", "Dias s/ Vendas"]
    ];

    const bodyData = state.filteredData.map(item => {
        const prodCodeStr = `${item.descricao}\n(Cód: ${item.codigoCompleto})`;
        let estoqStr = `${item.estoqEmb1.toLocaleString('pt-BR')}CX`;
        if (item.estoqEmb9 > 0) estoqStr += ` + ${item.estoqEmb9.toLocaleString('pt-BR')}UN`;

        const valEstoqueFormatted = item.valorEstoqueTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        if (isDetailed) {
            return [
                prodCodeStr,
                item.embalagem || '-',
                estoqStr,
                valEstoqueFormatted,
                item.pedidosPendentes.toLocaleString('pt-BR'),
                `${item.rentabilidade.toFixed(2)}%`,
                item.dtUltEnt || '-',
                item.qtdUltEnt.toLocaleString('pt-BR'),
                `${Math.round(item.idade)}d`,
                `${item.diasSemVenda}d`,
                item.sta || 'Ativo',
                item.comprador || '-'
            ];
        } else {
            return [
                prodCodeStr,
                item.embalagem || '-',
                estoqStr,
                item.dtUltEnt || '-',
                item.qtdUltEnt.toLocaleString('pt-BR'),
                `${item.diasSemVenda} dias`
            ];
        }
    });

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR');
    const generationStamp = `Gerado em: ${dateFormatted} às ${timeFormatted}`;

    doc.autoTable({
        head: headers,
        body: bodyData,
        startY: 18,
        margin: { top: 18, bottom: 20, left: 6, right: 6 },
        theme: 'grid',
        styles: {
            fontSize: 6,
            cellPadding: 0.8,
            valign: 'middle',
            overflow: 'linebreak',
            lineColor: [203, 213, 225],
            lineWidth: 0.15
        },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 6.5,
            cellPadding: 1
        },
        columnStyles: isDetailed ? {
            0: { cellWidth: 38 },
            1: { cellWidth: 11, halign: 'center' },
            2: { cellWidth: 20, halign: 'right' },
            3: { cellWidth: 21, halign: 'right' },
            4: { cellWidth: 13, halign: 'right' },
            5: { cellWidth: 12, halign: 'right' },
            6: { cellWidth: 14, halign: 'center' },
            7: { cellWidth: 12, halign: 'right' },
            8: { cellWidth: 10, halign: 'center' },
            9: { cellWidth: 13, halign: 'center' },
            10: { cellWidth: 11, halign: 'center' },
            11: { cellWidth: 22 }
        } : {
            0: { cellWidth: 68 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 32, halign: 'right' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 30, halign: 'center' }
        },
        didDrawPage: (data) => {
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(11, 17, 32);
            doc.text("StockAnalytics - " + titleText, 6, 9);

            doc.setFontSize(6.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(`Total SKUs: ${state.filteredData.length.toLocaleString('pt-BR')}`, 6, 13.5);

            doc.setLineWidth(0.2);
            doc.setDrawColor(203, 213, 225);
            doc.line(6, 15, doc.internal.pageSize.width - 6, 15);

            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(6.5);
            doc.setTextColor(71, 85, 105);

            doc.text("Assinatura: ___________________________", 6, pageHeight - 11);
            doc.text("Data: ____/____/________", 90, pageHeight - 11);

            doc.setDrawColor(226, 232, 240);
            doc.line(6, pageHeight - 8, pageWidth - 6, pageHeight - 8);

            doc.setFontSize(6);
            doc.text(generationStamp, 6, pageHeight - 4);
            doc.text(`Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`, pageWidth - 25, pageHeight - 4);
        }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 4);
    }

    const fileName = isDetailed ? `Relatorio_Detalhado_Estoque_${dateFormatted.replace(/\//g, '-')}.pdf` : `Relatorio_Simples_Estoque_${dateFormatted.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
}