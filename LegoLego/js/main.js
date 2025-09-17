// 레고 모델링 스튜디오 - Notion 스타일 메인 JavaScript

class LegoModeler {
    constructor() {
        this.blocks = [];
        this.history = [];
        this.currentColor = '#ef4444';
        this.currentBlockType = '2x2';
        this.currentBlockSize = 40;
        this.gridEnabled = true;
        this.gridSize = 20; // Grid size in pixels
        this.darkTheme = false;
        this.statistics = {
            totalBlocks: 0,
            usedColors: new Set(),
            blockTypes: {},
            recentActivity: []
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.initCharts();
        this.updateUI();
        this.initTheme();
    }
    
    bindEvents() {
        // Sidebar navigation
        this.bindNavigationEvents();
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        
        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentColor = e.target.dataset.color;
                this.updateColorSelection(e.target);
            });
        });
        
        document.getElementById('customColor').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.updateColorSelection(null);
        });
        
        // Block type selection
        document.getElementById('blockType').addEventListener('change', (e) => {
            this.currentBlockType = e.target.value;
        });
        
        // Block size slider
        const sizeSlider = document.getElementById('blockSize');
        sizeSlider.addEventListener('input', (e) => {
            this.currentBlockSize = parseInt(e.target.value);
            document.getElementById('sizeValue').textContent = e.target.value + 'px';
        });
        
        // Block count controls
        document.getElementById('decreaseCount').addEventListener('click', () => {
            const input = document.getElementById('blockCount');
            const value = Math.max(1, parseInt(input.value) - 1);
            input.value = value;
        });
        
        document.getElementById('increaseCount').addEventListener('click', () => {
            const input = document.getElementById('blockCount');
            const value = Math.min(100, parseInt(input.value) + 1);
            input.value = value;
        });
        
        // Action buttons
        document.getElementById('addBlocks').addEventListener('click', () => this.addBlocks());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
        document.getElementById('saveModel').addEventListener('click', () => this.saveModel());
        document.getElementById('undoAction').addEventListener('click', () => this.undoAction());
        document.getElementById('gridToggle').addEventListener('click', () => this.toggleGrid());
        
        // Building area interactions
        document.getElementById('buildingArea').addEventListener('click', (e) => {
            if (e.target.classList.contains('lego-brick')) {
                this.removeBrick(e.target);
            } else if (e.target.id === 'buildingArea' || e.target.closest('#buildingArea')) {
                this.addBrickAtPosition(e);
            }
        });
    }
    
    bindNavigationEvents() {
        // Page navigation
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
                
                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // Dropdown menus
        document.querySelectorAll('.nav-item[data-dropdown]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdownId = item.dataset.dropdown + 'Submenu';
                const submenu = document.getElementById(dropdownId);
                const arrow = item.querySelector('.arrow');
                
                if (submenu) {
                    const isOpen = submenu.classList.contains('open');
                    
                    // Close all other dropdowns
                    document.querySelectorAll('.nav-submenu').forEach(menu => {
                        menu.classList.remove('open');
                    });
                    document.querySelectorAll('.nav-item').forEach(nav => {
                        nav.classList.remove('expanded');
                    });
                    
                    if (!isOpen) {
                        submenu.classList.add('open');
                        item.classList.add('expanded');
                    }
                }
            });
        });
    }
    
    switchPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        
        // Show selected page
        const targetPage = document.getElementById(page + 'Page');
        if (targetPage) {
            targetPage.style.display = 'block';
            
            // Update breadcrumb
            document.getElementById('currentPageTitle').textContent = 
                page === 'modeling' ? '모델링' : '대시보드';
            
            if (page === 'dashboard') {
                this.updateDashboard();
            }
        }
    }
    
    toggleTheme() {
        this.darkTheme = !this.darkTheme;
        document.body.setAttribute('data-theme', this.darkTheme ? 'dark' : 'light');
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = this.darkTheme ? 'fas fa-sun' : 'fas fa-moon';
        
        localStorage.setItem('theme', this.darkTheme ? 'dark' : 'light');
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.toggleTheme();
        }
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }
    
    updateColorSelection(selectedBtn) {
        // Reset all color button selections
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Highlight selected color
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }
    
    addBlocks() {
        const count = parseInt(document.getElementById('blockCount').value);
        const buildingArea = document.getElementById('buildingArea');
        
        // Save state for undo
        this.saveState();
        
        // Remove placeholder if present
        const placeholder = buildingArea.querySelector('.building-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        for (let i = 0; i < count; i++) {
            this.createBrick();
        }
        
        this.updateStatistics();
        this.updateUI();
        this.addToHistory(`${count}개의 ${this.currentBlockType} 블록을 추가했습니다.`);
    }
    
    createBrick() {
        const brick = document.createElement('div');
        brick.className = 'lego-brick';
        
        // Set brick dimensions based on type
        const dimensions = this.getBlockDimensions(this.currentBlockType);
        const width = dimensions.width * (this.currentBlockSize / 40);
        const height = dimensions.height * (this.currentBlockSize / 40);
        
        brick.style.width = width + 'px';
        brick.style.height = height + 'px';
        brick.style.backgroundColor = this.currentColor;
        brick.dataset.blockType = this.currentBlockType;
        brick.dataset.color = this.currentColor;
        brick.dataset.size = this.currentBlockSize;
        
        // Random position in building area with grid snap
        const buildingArea = document.getElementById('buildingArea');
        const position = this.getRandomGridPosition(buildingArea, width, height);
        
        brick.style.left = position.x + 'px';
        brick.style.top = position.y + 'px';
        
        // Make draggable
        this.makeDraggable(brick);
        
        buildingArea.appendChild(brick);
        this.blocks.push({
            element: brick,
            type: this.currentBlockType,
            color: this.currentColor,
            size: this.currentBlockSize,
            x: position.x,
            y: position.y
        });
        
        // Add fade-in animation
        brick.classList.add('fade-in');
    }
    
    addBrickAtPosition(event) {
        if (event.target.classList.contains('lego-brick')) return;
        
        const buildingArea = document.getElementById('buildingArea');
        const rect = buildingArea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Save state for undo
        this.saveState();
        
        // Remove placeholder if present
        const placeholder = buildingArea.querySelector('.building-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const brick = document.createElement('div');
        brick.className = 'lego-brick';
        
        const dimensions = this.getBlockDimensions(this.currentBlockType);
        const width = dimensions.width * (this.currentBlockSize / 40);
        const height = dimensions.height * (this.currentBlockSize / 40);
        
        brick.style.width = width + 'px';
        brick.style.height = height + 'px';
        brick.style.backgroundColor = this.currentColor;
        brick.dataset.blockType = this.currentBlockType;
        brick.dataset.color = this.currentColor;
        brick.dataset.size = this.currentBlockSize;
        
        // Snap to grid if enabled
        const position = this.gridEnabled ? 
            this.snapToGrid(x - width/2, y - height/2) : 
            { x: Math.max(0, x - width/2), y: Math.max(0, y - height/2) };
        
        brick.style.left = position.x + 'px';
        brick.style.top = position.y + 'px';
        
        this.makeDraggable(brick);
        buildingArea.appendChild(brick);
        
        this.blocks.push({
            element: brick,
            type: this.currentBlockType,
            color: this.currentColor,
            size: this.currentBlockSize,
            x: position.x,
            y: position.y
        });
        
        brick.classList.add('fade-in');
        this.updateStatistics();
        this.updateUI();
        this.addToHistory(`클릭으로 ${this.currentBlockType} 블록을 추가했습니다.`);
    }
    
    getRandomGridPosition(container, width, height) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const maxGridX = Math.floor((containerWidth - width) / this.gridSize);
        const maxGridY = Math.floor((containerHeight - height) / this.gridSize);
        
        const gridX = Math.floor(Math.random() * Math.max(1, maxGridX));
        const gridY = Math.floor(Math.random() * Math.max(1, maxGridY));
        
        return {
            x: gridX * this.gridSize,
            y: gridY * this.gridSize
        };
    }
    
    snapToGrid(x, y) {
        if (!this.gridEnabled) return { x, y };
        
        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }
    
    getBlockDimensions(type) {
        const dimensions = {
            '1x1': { width: 20, height: 20 },
            '1x2': { width: 40, height: 20 },
            '1x4': { width: 80, height: 20 },
            '2x2': { width: 40, height: 40 },
            '2x4': { width: 80, height: 40 }
        };
        return dimensions[type] || dimensions['2x2'];
    }
    
    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        element.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            element.classList.add('dragging');
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newX = initialX + dx;
            let newY = initialY + dy;
            
            // Snap to grid if enabled
            if (this.gridEnabled) {
                const snapped = this.snapToGrid(newX, newY);
                newX = snapped.x;
                newY = snapped.y;
            }
            
            // Constrain to building area
            const buildingArea = document.getElementById('buildingArea');
            const maxX = buildingArea.clientWidth - element.offsetWidth;
            const maxY = buildingArea.clientHeight - element.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
                
                // Update block position in array
                const blockData = this.blocks.find(b => b.element === element);
                if (blockData) {
                    blockData.x = element.offsetLeft;
                    blockData.y = element.offsetTop;
                }
            }
        });
    }
    
    removeBrick(brick) {
        this.saveState();
        
        const blockIndex = this.blocks.findIndex(b => b.element === brick);
        if (blockIndex !== -1) {
            this.blocks.splice(blockIndex, 1);
        }
        
        brick.remove();
        this.updateStatistics();
        this.updateUI();
        this.addToHistory('블록을 제거했습니다.');
        
        // Add placeholder if no blocks remain
        if (this.blocks.length === 0) {
            this.showPlaceholder();
        }
    }
    
    clearAll() {
        if (this.blocks.length === 0) return;
        
        this.saveState();
        
        this.blocks.forEach(block => block.element.remove());
        this.blocks = [];
        
        this.showPlaceholder();
        this.updateStatistics();
        this.updateUI();
        this.addToHistory('모든 블록을 지웠습니다.');
    }
    
    showPlaceholder() {
        const buildingArea = document.getElementById('buildingArea');
        const placeholder = document.createElement('div');
        placeholder.className = 'building-placeholder';
        placeholder.innerHTML = `
            <div class="icon">
                <i class="fas fa-cubes"></i>
            </div>
            <div class="title">레고 블록을 추가해보세요!</div>
            <div class="subtitle">좌측 제어 패널에서 블록을 설정하고 '블록 추가'를 클릭하거나<br>여기를 직접 클릭하여 블록을 추가할 수 있습니다.</div>
        `;
        buildingArea.appendChild(placeholder);
    }
    
    saveState() {
        const state = this.blocks.map(block => ({
            type: block.type,
            color: block.color,
            size: block.size,
            x: block.x,
            y: block.y
        }));
        this.history.push(JSON.stringify(state));
        
        // Keep only last 50 states
        if (this.history.length > 50) {
            this.history.shift();
        }
    }
    
    undoAction() {
        if (this.history.length === 0) return;
        
        const previousState = JSON.parse(this.history.pop());
        
        // Clear current blocks
        this.blocks.forEach(block => block.element.remove());
        this.blocks = [];
        
        // Restore previous state
        const buildingArea = document.getElementById('buildingArea');
        previousState.forEach(blockData => {
            const brick = document.createElement('div');
            brick.className = 'lego-brick';
            
            const dimensions = this.getBlockDimensions(blockData.type);
            const width = dimensions.width * (blockData.size / 40);
            const height = dimensions.height * (blockData.size / 40);
            
            brick.style.width = width + 'px';
            brick.style.height = height + 'px';
            brick.style.backgroundColor = blockData.color;
            brick.dataset.blockType = blockData.type;
            brick.dataset.color = blockData.color;
            brick.dataset.size = blockData.size;
            
            brick.style.left = blockData.x + 'px';
            brick.style.top = blockData.y + 'px';
            
            this.makeDraggable(brick);
            buildingArea.appendChild(brick);
            
            this.blocks.push({
                element: brick,
                type: blockData.type,
                color: blockData.color,
                size: blockData.size,
                x: blockData.x,
                y: blockData.y
            });
        });
        
        if (this.blocks.length === 0) {
            this.showPlaceholder();
        }
        
        this.updateStatistics();
        this.updateUI();
        this.addToHistory('작업을 되돌렸습니다.');
    }
    
    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        const buildingArea = document.getElementById('buildingArea');
        const button = document.getElementById('gridToggle');
        
        if (this.gridEnabled) {
            buildingArea.classList.add('grid-enabled');
            button.innerHTML = '<i class="fas fa-th"></i> 격자';
        } else {
            buildingArea.classList.remove('grid-enabled');
            button.innerHTML = '<i class="fas fa-th"></i> 격자';
        }
        
        // Update grid snap status
        document.getElementById('gridSnapStatus').textContent = 
            this.gridEnabled ? '활성화' : '비활성화';
        
        this.addToHistory(`격자 스냅을 ${this.gridEnabled ? '활성화' : '비활성화'}했습니다.`);
    }
    
    saveModel() {
        if (this.blocks.length === 0) {
            alert('저장할 블록이 없습니다.');
            return;
        }
        
        const modelData = {
            timestamp: new Date().toISOString(),
            blocks: this.blocks.map(block => ({
                type: block.type,
                color: block.color,
                size: block.size,
                x: block.x,
                y: block.y
            })),
            statistics: {
                totalBlocks: this.statistics.totalBlocks,
                usedColors: Array.from(this.statistics.usedColors),
                blockTypes: { ...this.statistics.blockTypes }
            }
        };
        
        // Save to localStorage
        const savedModels = JSON.parse(localStorage.getItem('legoModels') || '[]');
        savedModels.push(modelData);
        localStorage.setItem('legoModels', JSON.stringify(savedModels));
        
        alert('모델이 저장되었습니다!');
        this.addToHistory('모델을 저장했습니다.');
    }
    
    updateStatistics() {
        // Reset statistics
        this.statistics.totalBlocks = this.blocks.length;
        this.statistics.usedColors.clear();
        this.statistics.blockTypes = {};
        
        // Calculate statistics
        this.blocks.forEach(block => {
            this.statistics.usedColors.add(block.color);
            this.statistics.blockTypes[block.type] = (this.statistics.blockTypes[block.type] || 0) + 1;
        });
    }
    
    updateUI() {
        // Update current stats in control panel
        document.getElementById('totalBlocks').textContent = this.statistics.totalBlocks;
        document.getElementById('usedColors').textContent = this.statistics.usedColors.size;
    }
    
    addToHistory(message) {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        this.statistics.recentActivity.unshift({
            message: message,
            timestamp: timestamp
        });
        
        // Keep only last 20 activities
        if (this.statistics.recentActivity.length > 20) {
            this.statistics.recentActivity.pop();
        }
    }
    
    updateDashboard() {
        // Update dashboard statistics
        document.getElementById('dashTotalBlocks').textContent = this.statistics.totalBlocks;
        document.getElementById('dashUsedColors').textContent = this.statistics.usedColors.size;
        
        // Update saved models count
        const savedModels = JSON.parse(localStorage.getItem('legoModels') || '[]');
        document.getElementById('dashSavedModels').textContent = savedModels.length;
        
        // Update charts
        this.updateCharts();
        
        // Update recent activity
        this.updateRecentActivity();
    }
    
    initCharts() {
        // Block Type Chart
        const blockTypeCtx = document.getElementById('blockTypeChart').getContext('2d');
        this.blockTypeChart = new Chart(blockTypeCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#eab308', '#8b5cf6'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
        
        // Color Distribution Chart
        const colorDistCtx = document.getElementById('colorDistChart').getContext('2d');
        this.colorDistChart = new Chart(colorDistCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    updateCharts() {
        // Update block type chart
        const blockTypeLabels = Object.keys(this.statistics.blockTypes);
        const blockTypeData = Object.values(this.statistics.blockTypes);
        
        this.blockTypeChart.data.labels = blockTypeLabels;
        this.blockTypeChart.data.datasets[0].data = blockTypeData;
        this.blockTypeChart.update();
        
        // Update color distribution chart
        const colorCounts = {};
        this.blocks.forEach(block => {
            colorCounts[block.color] = (colorCounts[block.color] || 0) + 1;
        });
        
        const colorLabels = Object.keys(colorCounts);
        const colorData = Object.values(colorCounts);
        
        this.colorDistChart.data.labels = colorLabels.map((color, index) => `색상 ${index + 1}`);
        this.colorDistChart.data.datasets[0].data = colorData;
        this.colorDistChart.data.datasets[0].backgroundColor = colorLabels;
        this.colorDistChart.update();
    }
    
    updateRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        
        if (this.statistics.recentActivity.length === 0) {
            activityContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    아직 활동이 없습니다.
                </div>
            `;
            return;
        }
        
        activityContainer.innerHTML = this.statistics.recentActivity
            .slice(0, 10) // Show only last 10 activities
            .map(activity => `
                <div class="activity-item">
                    <span class="activity-message">${activity.message}</span>
                    <span class="activity-time">${activity.timestamp}</span>
                </div>
            `).join('');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LegoModeler();
});