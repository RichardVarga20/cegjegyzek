document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const companyList = document.getElementById('company-list');
    const companyCount = document.getElementById('company-count');
    const activeCount = document.getElementById('active-count');
    const inactiveCount = document.getElementById('inactive-count');
    const newCount = document.getElementById('new-count');
    const searchInput = document.getElementById('search-input');
    const addCompanyBtn = document.getElementById('add-company-btn');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');
    const paginationText = document.getElementById('pagination-text');
    
    // Modal elements
    const companyModalElement = document.getElementById('companyModal');
    const companyDetailsModalElement = document.getElementById('companyDetailsModal');
    
    // Initialize Bootstrap modals
    const companyModal = new bootstrap.Modal(companyModalElement);
    const companyDetailsModal = new bootstrap.Modal(companyDetailsModalElement);
    
    const companyForm = document.getElementById('company-form');
    const companyIdInput = document.getElementById('company-id');
    const companyNameInput = document.getElementById('company-name');
    const companyTaxIdInput = document.getElementById('company-tax-id');
    const companyRegNumberInput = document.getElementById('company-reg-number');
    const companyFoundedInput = document.getElementById('company-founded');
    const companyStatusInput = document.getElementById('company-status');
    const companyIndustryInput = document.getElementById('company-industry');
    const companyAddressInput = document.getElementById('company-address');
    const companyEmailInput = document.getElementById('company-email');
    const companyPhoneInput = document.getElementById('company-phone');
    const companyDescriptionInput = document.getElementById('company-description');
    
    const saveCompanyBtn = document.getElementById('save-company-btn');
    const deleteCompanyBtn = document.getElementById('delete-company-btn');
    const editCompanyBtn = document.getElementById('edit-company-btn');
    
    // Pagination state
    let currentPage = 1;
    const itemsPerPage = 10;
    
    // Sorting state
    let currentSort = {
        field: 'name',
        direction: 'asc'
    };
    
    // Filter state
    let filters = {
        status: ['active', 'suspended', 'closed'],
        yearFrom: null,
        yearTo: null,
        industry: ''
    };
    
    // Sample company data
    let companies = JSON.parse(localStorage.getItem('companies')) || generateSampleCompanies();
    
    // Initialize
    renderCompanies();
    updateStats();
    setupEventListeners();
    
    // Event listeners
    function setupEventListeners() {
        // Search
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            renderCompanies();
        });
        
        // Add company
        addCompanyBtn.addEventListener('click', function() {
            clearCompanyForm();
            document.getElementById('companyModalLabel').textContent = 'Új cég hozzáadása';
            deleteCompanyBtn.classList.add('d-none');
            companyModal.show();
        });
        
        // Save company
        saveCompanyBtn.addEventListener('click', saveCompany);
        
        // Delete company
        deleteCompanyBtn.addEventListener('click', deleteCompany);
        
        // Sort columns
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', function() {
                const field = this.getAttribute('data-sort');
                
                if (currentSort.field === field) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.direction = 'asc';
                }
                
                renderCompanies();
            });
        });
        
        // Filters
        applyFiltersBtn.addEventListener('click', function() {
            // Get status filters
            filters.status = [];
            if (document.getElementById('status-active').checked) filters.status.push('active');
            if (document.getElementById('status-suspended').checked) filters.status.push('suspended');
            if (document.getElementById('status-closed').checked) filters.status.push('closed');
            
            // Get year range
            const yearFrom = document.getElementById('year-from').value;
            const yearTo = document.getElementById('year-to').value;
            filters.yearFrom = yearFrom ? parseInt(yearFrom) : null;
            filters.yearTo = yearTo ? parseInt(yearTo) : null;
            
            // Get industry
            filters.industry = document.getElementById('industry-filter').value;
            
            currentPage = 1;
            renderCompanies();
        });
        
        resetFiltersBtn.addEventListener('click', function() {
            // Reset checkboxes
            document.getElementById('status-active').checked = true;
            document.getElementById('status-suspended').checked = true;
            document.getElementById('status-closed').checked = true;
            
            // Reset year inputs
            document.getElementById('year-from').value = '';
            document.getElementById('year-to').value = '';
            
            // Reset industry select
            document.getElementById('industry-filter').value = '';
            
            // Reset filter state
            filters = {
                status: ['active', 'suspended', 'closed'],
                yearFrom: null,
                yearTo: null,
                industry: ''
            };
            
            currentPage = 1;
            renderCompanies();
        });
        
        // Pagination
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderCompanies();
            }
        });
        
        nextPageBtn.addEventListener('click', function() {
            const filteredCompanies = getFilteredCompanies();
            const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
            
            if (currentPage < totalPages) {
                currentPage++;
                renderCompanies();
            }
        });
    }
    
    // Render companies
    function renderCompanies() {
        const filteredCompanies = getFilteredCompanies();
        const sortedCompanies = getSortedCompanies(filteredCompanies);
        
        // Update company count
        companyCount.textContent = companies.length;
        
        // Pagination
        const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, sortedCompanies.length);
        const paginatedCompanies = sortedCompanies.slice(start, end);
        
        // Update pagination text
        paginationText.textContent = `${start + 1}-${end} / ${sortedCompanies.length}`;
        
        // Update pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Render page numbers
        renderPageNumbers(totalPages);
        
        // Clear the table
        companyList.innerHTML = '';
        
        // Render companies
        if (paginatedCompanies.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="text-center py-4">Nincs találat a keresési feltételeknek megfelelően.</td>
            `;
            companyList.appendChild(emptyRow);
            return;
        }
        
        paginatedCompanies.forEach(company => {
            const row = document.createElement('tr');
            
            // Format date
            const foundedDate = new Date(company.founded);
            const formattedDate = `${foundedDate.getFullYear()}.${String(foundedDate.getMonth() + 1).padStart(2, '0')}.${String(foundedDate.getDate()).padStart(2, '0')}.`;
            
            // Status text
            let statusText = '';
            let statusClass = '';
            
            switch (company.status) {
                case 'active':
                    statusText = 'Aktív';
                    statusClass = 'status-active';
                    break;
                case 'suspended':
                    statusText = 'Felfüggesztett';
                    statusClass = 'status-suspended';
                    break;
                case 'closed':
                    statusText = 'Megszűnt';
                    statusClass = 'status-closed';
                    break;
            }
            
            row.innerHTML = `
                <td class="company-name">${company.name}</td>
                <td>${company.taxId}</td>
                <td>${company.regNumber}</td>
                <td>${formattedDate}</td>
                <td><span class="company-status ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-icons">
                        <div class="action-icon view" data-id="${company.id}" title="Részletek">
                            <i class="bi bi-eye"></i>
                        </div>
                        <div class="action-icon edit" data-id="${company.id}" title="Szerkesztés">
                            <i class="bi bi-pencil"></i>
                        </div>
                        <div class="action-icon delete" data-id="${company.id}" title="Törlés">
                            <i class="bi bi-trash"></i>
                        </div>
                    </div>
                </td>
            `;
            
            companyList.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.action-icon.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const companyId = this.getAttribute('data-id');
                showCompanyDetails(companyId);
            });
        });
        
        document.querySelectorAll('.action-icon.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const companyId = this.getAttribute('data-id');
                editCompany(companyId);
            });
        });
        
        document.querySelectorAll('.action-icon.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const companyId = this.getAttribute('data-id');
                confirmDelete(companyId);
            });
        });
    }
    
    // Get filtered companies
    function getFilteredCompanies() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        return companies.filter(company => {
            // Search filter
            const matchesSearch = 
                company.name.toLowerCase().includes(searchTerm) ||
                company.taxId.toLowerCase().includes(searchTerm) ||
                company.address.toLowerCase().includes(searchTerm);
            
            // Status filter
            const matchesStatus = filters.status.includes(company.status);
            
            // Year filter
            const foundedYear = new Date(company.founded).getFullYear();
            const matchesYearFrom = filters.yearFrom ? foundedYear >= filters.yearFrom : true;
            const matchesYearTo = filters.yearTo ? foundedYear <= filters.yearTo : true;
            
            // Industry filter
            const matchesIndustry = filters.industry ? company.industry === filters.industry : true;
            
            return matchesSearch && matchesStatus && matchesYearFrom && matchesYearTo && matchesIndustry;
        });
    }
    
    // Sort companies
    function getSortedCompanies(companies) {
        return [...companies].sort((a, b) => {
            let valueA, valueB;
            
            // Handle different field types
            switch (currentSort.field) {
                case 'founded':
                    valueA = new Date(a.founded).getTime();
                    valueB = new Date(b.founded).getTime();
                    break;
                default:
                    valueA = a[currentSort.field];
                    valueB = b[currentSort.field];
                    
                    // String comparison for non-date fields
                    if (typeof valueA === 'string') {
                        valueA = valueA.toLowerCase();
                        valueB = valueB.toLowerCase();
                    }
            }
            
            // Sort direction
            if (currentSort.direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }
    
    // Render page numbers
    function renderPageNumbers(totalPages) {
        pageNumbers.innerHTML = '';
        
        // Limit displayed page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageNumber = document.createElement('div');
            pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            
            pageNumber.addEventListener('click', function() {
                currentPage = i;
                renderCompanies();
            });
            
            pageNumbers.appendChild(pageNumber);
        }
    }
    
    // Update statistics
    function updateStats() {
        const active = companies.filter(company => company.status === 'active').length;
        const inactive = companies.filter(company => company.status !== 'active').length;
        
        const currentYear = new Date().getFullYear();
        const newCompanies = companies.filter(company => {
            const foundedYear = new Date(company.founded).getFullYear();
            return foundedYear === currentYear;
        }).length;
        
        activeCount.textContent = active;
        inactiveCount.textContent = inactive;
        newCount.textContent = newCompanies;
    }
    
    // Save company
    function saveCompany() {
        const name = companyNameInput.value.trim();
        const taxId = companyTaxIdInput.value.trim();
        const regNumber = companyRegNumberInput.value.trim();
        const founded = companyFoundedInput.value;
        const status = companyStatusInput.value;
        const industry = companyIndustryInput.value;
        const address = companyAddressInput.value.trim();
        const email = companyEmailInput.value.trim();
        const phone = companyPhoneInput.value.trim();
        const description = companyDescriptionInput.value.trim();
        const companyId = companyIdInput.value;
        
        if (!name || !taxId || !regNumber || !founded || !address) {
            alert('Kérjük, töltse ki az összes kötelező mezőt!');
            return;
        }
        
        if (companyId) {
            // Update existing company
            const companyIndex = companies.findIndex(company => company.id === companyId);
            if (companyIndex !== -1) {
                companies[companyIndex] = {
                    ...companies[companyIndex],
                    name,
                    taxId,
                    regNumber,
                    founded,
                    status,
                    industry,
                    address,
                    email,
                    phone,
                    description
                };
            }
        } else {
            // Add new company
            const newCompany = {
                id: generateId(),
                name,
                taxId,
                regNumber,
                founded,
                status,
                industry,
                address,
                email,
                phone,
                description
            };
            
            companies.push(newCompany);
        }
        
        // Save to localStorage
        localStorage.setItem('companies', JSON.stringify(companies));
        
        // Close modal and refresh companies
        companyModal.hide();
        renderCompanies();
        updateStats();
    }
    
    // Delete company
    function deleteCompany() {
        const companyId = companyIdInput.value;
        if (!companyId) return;
        
        if (confirm('Biztosan törölni szeretné ezt a céget?')) {
            companies = companies.filter(company => company.id !== companyId);
            
            // Save to localStorage
            localStorage.setItem('companies', JSON.stringify(companies));
            
            // Close modal and refresh companies
            companyModal.hide();
            renderCompanies();
            updateStats();
        }
    }
    
    // Confirm delete
    function confirmDelete(companyId) {
        const company = companies.find(company => company.id === companyId);
        if (!company) return;
        
        if (confirm(`Biztosan törölni szeretné a(z) "${company.name}" céget?`)) {
            companies = companies.filter(company => company.id !== companyId);
            
            // Save to localStorage
            localStorage.setItem('companies', JSON.stringify(companies));
            
            // Refresh companies
            renderCompanies();
            updateStats();
        }
    }
    
    // Show company details
    function showCompanyDetails(companyId) {
        const company = companies.find(company => company.id === companyId);
        if (!company) return;
        
        const detailsTitle = document.getElementById('company-details-title');
        const statusIndicator = document.getElementById('company-status-indicator');
        const detailsTaxId = document.getElementById('details-tax-id');
        const detailsRegNumber = document.getElementById('details-reg-number');
        const detailsFounded = document.getElementById('details-founded');
        const detailsIndustry = document.getElementById('details-industry');
        const detailsStatus = document.getElementById('details-status');
        const detailsAddress = document.getElementById('details-address');
        const detailsEmail = document.getElementById('details-email');
        const detailsPhone = document.getElementById('details-phone');
        const detailsDescription = document.getElementById('details-description');
        
        // Set company details
        detailsTitle.textContent = company.name;
        
        // Set status indicator color
        switch (company.status) {
            case 'active':
                statusIndicator.style.backgroundColor = 'var(--status-active)';
                break;
            case 'suspended':
                statusIndicator.style.backgroundColor = 'var(--status-suspended)';
                break;
            case 'closed':
                statusIndicator.style.backgroundColor = 'var(--status-closed)';
                break;
        }
        
        // Format date
        const foundedDate = new Date(company.founded);
        const formattedDate = `${foundedDate.getFullYear()}.${String(foundedDate.getMonth() + 1).padStart(2, '0')}.${String(foundedDate.getDate()).padStart(2, '0')}.`;
        
        detailsTaxId.textContent = company.taxId;
        detailsRegNumber.textContent = company.regNumber;
        detailsFounded.textContent = formattedDate;
        
        // Format industry
        let industryText = '';
        switch (company.industry) {
            case 'it': industryText = 'IT és Telekommunikáció'; break;
            case 'finance': industryText = 'Pénzügy és Biztosítás'; break;
            case 'manufacturing': industryText = 'Gyártás és Ipar'; break;
            case 'retail': industryText = 'Kereskedelem'; break;
            case 'services': industryText = 'Szolgáltatások'; break;
            case 'construction': industryText = 'Építőipar'; break;
            case 'healthcare': industryText = 'Egészségügy'; break;
            case 'education': industryText = 'Oktatás'; break;
            case 'agriculture': industryText = 'Mezőgazdaság'; break;
            case 'other': industryText = 'Egyéb'; break;
        }
        detailsIndustry.textContent = industryText;
        
        // Format status
        let statusText = '';
        switch (company.status) {
            case 'active': statusText = 'Aktív'; break;
            case 'suspended': statusText = 'Felfüggesztett'; break;
            case 'closed': statusText = 'Megszűnt'; break;
        }
        detailsStatus.textContent = statusText;
        
        detailsAddress.textContent = company.address;
        detailsEmail.textContent = company.email || 'Nincs megadva';
        detailsPhone.textContent = company.phone || 'Nincs megadva';
        detailsDescription.textContent = company.description || 'Nincs leírás';
        
        // Set up edit button
        editCompanyBtn.onclick = () => {
            companyDetailsModal.hide();
            editCompany(company.id);
        };
        
        companyDetailsModal.show();
    }
    
    // Edit company
    function editCompany(companyId) {
        const company = companies.find(company => company.id === companyId);
        if (!company) return;
        
        document.getElementById('companyModalLabel').textContent = 'Cég szerkesztése';
        
        companyIdInput.value = company.id;
        companyNameInput.value = company.name;
        companyTaxIdInput.value = company.taxId;
        companyRegNumberInput.value = company.regNumber;
        companyFoundedInput.value = company.founded;
        companyStatusInput.value = company.status;
        companyIndustryInput.value = company.industry;
        companyAddressInput.value = company.address;
        companyEmailInput.value = company.email || '';
        companyPhoneInput.value = company.phone || '';
        companyDescriptionInput.value = company.description || '';
        
        deleteCompanyBtn.classList.remove('d-none');
        
        companyModal.show();
    }
    
    // Clear company form
    function clearCompanyForm() {
        companyForm.reset();
        companyIdInput.value = '';
    }
    
    // Generate ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // Generate sample companies
    function generateSampleCompanies() {
        const sampleCompanies = [
            {
                id: generateId(),
                name: 'Tech Solutions Kft.',
                taxId: '12345678-2-42',
                regNumber: '01-09-123456',
                founded: '2018-05-15',
                status: 'active',
                industry: 'it',
                address: '1065 Budapest, Nagymező utca 44-46.',
                email: 'info@techsolutions.hu',
                phone: '+36 1 234 5678',
                description: 'Szoftverfejlesztés és IT tanácsadás vállalatok számára.'
            },
            {
                id: generateId(),
                name: 'Pénzügyi Tanácsadó Zrt.',
                taxId: '87654321-2-41',
                regNumber: '01-10-987654',
                founded: '2010-03-22',
                status: 'active',
                industry: 'finance',
                address: '1051 Budapest, Széchenyi tér 7-8.',
                email: 'kapcsolat@penzugyitanacsado.hu',
                phone: '+36 1 987 6543',
                description: 'Pénzügyi tanácsadás és befektetési szolgáltatások.'
            },
            {
                id: generateId(),
                name: 'Építő Mester Kft.',
                taxId: '23456789-2-43',
                regNumber: '01-09-234567',
                founded: '2015-08-10',
                status: 'active',
                industry: 'construction',
                address: '1095 Budapest, Soroksári út 32-34.',
                email: 'info@epitomester.hu',
                phone: '+36 1 345 6789',
                description: 'Lakó- és irodaépületek kivitelezése, felújítása.'
            },
            {
                id: generateId(),
                name: 'Egészség Centrum Bt.',
                taxId: '34567890-1-42',
                regNumber: '01-06-345678',
                founded: '2019-11-05',
                status: 'active',
                industry: 'healthcare',
                address: '1024 Budapest, Margit körút 85-87.',
                email: 'info@egeszsegcentrum.hu',
                phone: '+36 1 456 7890',
                description: 'Magánorvosi rendelő és egészségügyi szolgáltatások.'
            },
            {
                id: generateId(),
                name: 'Okos Iskola Nonprofit Kft.',
                taxId: '45678901-1-41',
                regNumber: '01-09-456789',
                founded: '2017-09-01',
                status: 'active',
                industry: 'education',
                address: '1085 Budapest, József körút 70-72.',
                email: 'kapcsolat@okosiskola.hu',
                phone: '+36 1 567 8901',
                description: 'Alternatív oktatási módszerek és programok fejlesztése.'
            },
            {
                id: generateId(),
                name: 'Zöld Gazda Kft.',
                taxId: '56789012-2-44',
                regNumber: '01-09-567890',
                founded: '2016-04-12',
                status: 'active',
                industry: 'agriculture',
                address: '1103 Budapest, Gyömrői út 140.',
                email: 'info@zoldgazda.hu',
                phone: '+36 1 678 9012',
                description: 'Biogazdálkodás és fenntartható mezőgazdasági megoldások.'
            },
            {
                id: generateId(),
                name: 'Divat Stúdió Kft.',
                taxId: '67890123-2-42',
                regNumber: '01-09-678901',
                founded: '2014-07-18',
                status: 'suspended',
                industry: 'retail',
                address: '1052 Budapest, Váci utca 10.',
                email: 'info@divatstudio.hu',
                phone: '+36 1 789 0123',
                description: 'Egyedi ruhatervezés és kiskereskedelmi értékesítés.'
            },
            {
                id: generateId(),
                name: 'Ipari Megoldások Zrt.',
                taxId: '78901234-2-41',
                regNumber: '01-10-789012',
                founded: '2008-02-25',
                status: 'active',
                industry: 'manufacturing',
                address: '1211 Budapest, Központi út 21-47.',
                email: 'kapcsolat@iparimegoldasok.hu',
                phone: '+36 1 890 1234',
                description: 'Ipari berendezések gyártása és karbantartása.'
            },
            {
                id: generateId(),
                name: 'Vendéglátó Kft.',
                taxId: '89012345-2-43',
                regNumber: '01-09-890123',
                founded: '2012-06-30',
                status: 'closed',
                industry: 'services',
                address: '1074 Budapest, Dohány utca 12-14.',
                email: 'info@vendeglato.hu',
                phone: '+36 1 901 2345',
                description: 'Éttermi és catering szolgáltatások.'
            },
            {
                id: generateId(),
                name: 'Logisztikai Központ Zrt.',
                taxId: '90123456-2-42',
                regNumber: '01-10-901234',
                founded: '2011-09-15',
                status: 'active',
                industry: 'services',
                address: '1239 Budapest, Európa út 6.',
                email: 'info@logisztikaikozpont.hu',
                phone: '+36 1 012 3456',
                description: 'Raktározás, szállítmányozás és logisztikai szolgáltatások.'
            },
            {
                id: generateId(),
                name: 'Kreatív Média Kft.',
                taxId: '01234567-2-41',
                regNumber: '01-09-012345',
                founded: '2020-01-10',
                status: 'active',
                industry: 'it',
                address: '1061 Budapest, Andrássy út 39.',
                email: 'hello@kreativmedia.hu',
                phone: '+36 1 123 4567',
                description: 'Digitális marketing és kreatív tartalomgyártás.'
            },
            {
                id: generateId(),
                name: 'Ingatlan Befektető Kft.',
                taxId: '12345678-1-43',
                regNumber: '01-09-123457',
                founded: '2013-11-20',
                status: 'suspended',
                industry: 'finance',
                address: '1054 Budapest, Szabadság tér 14.',
                email: 'info@ingatlanbefekteto.hu',
                phone: '+36 1 234 5679',
                description: 'Ingatlanfejlesztés és befektetési tanácsadás.'
            },
            {
                id: generateId(),
                name: 'Autó Centrum Kft.',
                taxId: '23456789-2-44',
                regNumber: '01-09-234568',
                founded: '2009-05-05',
                status: 'active',
                industry: 'retail',
                address: '1044 Budapest, Váci út 76-80.',
                email: 'info@autocentrum.hu',
                phone: '+36 1 345 6780',
                description: 'Új és használt autók értékesítése, szerviz szolgáltatások.'
            },
            {
                id: generateId(),
                name: 'Energia Szolgáltató Zrt.',
                taxId: '34567890-2-41',
                regNumber: '01-10-345679',
                founded: '2007-08-15',
                status: 'active',
                industry: 'services',
                address: '1132 Budapest, Váci út 72-74.',
                email: 'kapcsolat@energiaszolgaltato.hu',
                phone: '+36 1 456 7891',
                description: 'Megújuló energiaforrások és energiahatékonysági megoldások.'
            },
            {
                id: generateId(),
                name: 'Biztosító Partner Kft.',
                taxId: '45678901-2-42',
                regNumber: '01-09-456790',
                founded: '2015-03-30',
                status: 'active',
                industry: 'finance',
                address: '1134 Budapest, Dévai utca 11.',
                email: 'info@biztositopartner.hu',
                phone: '+36 1 567 8902',
                description: 'Biztosítási és pénzügyi tanácsadás magánszemélyek és vállalatok részére.'
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('companies', JSON.stringify(sampleCompanies));
        
        return sampleCompanies;
    }
});