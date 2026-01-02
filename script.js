// script.js
class MinesweeperGame {
    constructor() {
        this.board = [];
        this.gameBoard = document.getElementById('gameBoard');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('newGame');
        this.gameMessage = document.getElementById('gameMessage');
        this.timerDisplay = document.getElementById('timer');
        this.flagCountDisplay = document.getElementById('flagCount');
        this.mineCountDisplay = document.getElementById('mineCount');
        
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10, cellSize: 50, fontSize: 24 },
            medium: { rows: 16, cols: 16, mines: 40, cellSize: 30, fontSize: 18 },
            hard: { rows: 16, cols: 30, mines: 99, cellSize: 25, fontSize: 14 }
        };
        
        this.currentDifficulty = 'easy';
        this.gameActive = false;
        this.firstClick = true;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        
        // Custom mine image
        this.mineImages = [
            'resources/amon.png',
        ];
        
        this.init();
    }
    
    init() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.difficultySelect.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.startNewGame();
        });
        
        this.preloadImages();
        this.startNewGame();
    }
    
    preloadImages() {
        this.mineImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    startNewGame() {
        this.gameActive = true;
        this.firstClick = true;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.startTime = null;
        this.gameMessage.textContent = '';
        this.gameMessage.className = 'game-message';
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.updateTimer();
        this.createBoard();
        this.renderBoard();
        this.updateStats();
    }
    
    createBoard() {
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        this.board = [];
        
        for (let i = 0; i < rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    row: i,
                    col: j
                };
            }
        }
        
        this.totalCells = rows * cols;
        this.totalMines = mines;
    }
    
    placeMines(excludeRow, excludeCol) {
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        let minesPlaced = 0;
        
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            
            if ((row === excludeRow && col === excludeCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        this.calculateAdjacentMines();
    }
    
    calculateAdjacentMines() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!this.board[i][j].isMine) {
                    this.board[i][j].adjacentMines = this.countAdjacentMines(i, j);
                }
            }
        }
    }
    
    countAdjacentMines(row, col) {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        let count = 0;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    if (this.board[newRow][newCol].isMine) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    renderBoard() {
        const { rows, cols, cellSize, fontSize } = this.difficulties[this.currentDifficulty];
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        // ✅ Set CSS variables for cell size and font
        this.gameBoard.style.setProperty('--cell-size', `${cellSize}px`);
        this.gameBoard.style.setProperty('--font-size', `${fontSize}px`);
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellRightClick(i, j);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    handleCellClick(row, col) {
        if (!this.gameActive) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.startTimer();
            this.firstClick = false;
        }
        
        this.revealCell(row, col);
    }
    
    handleCellRightClick(row, col) {
        if (!this.gameActive) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed) return;
        
        const cellElement = this.getCellElement(row, col);
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
            cellElement.classList.remove('flagged');
        } else {
            cell.isFlagged = true;
            this.flagCount++;
            cellElement.classList.add('flagged');
        }
        
        this.updateStats();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        const cellElement = this.getCellElement(row, col);
        cellElement.classList.add('revealed');
        
        if (cell.isMine) {
            this.gameOver(row, col);
        } else {
            this.updateCellDisplay(cellElement, cell);
            
            if (cell.adjacentMines === 0) {
                this.revealAdjacentCells(row, col);
            }
            
            this.checkWinCondition();
        }
    }
    
    revealAdjacentCells(row, col) {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }
    
    updateCellDisplay(cellElement, cell) {
        if (cell.isMine) {
            const randomImage = this.mineImages[Math.floor(Math.random() * this.mineImages.length)];
            cellElement.style.backgroundImage = `url('${randomImage}')`;
            cellElement.classList.add('mine');
        } else if (cell.adjacentMines > 0) {
            cellElement.textContent = cell.adjacentMines;
            cellElement.classList.add(`number-${cell.adjacentMines}`);
        }
    }
    
    gameOver(row, col) {
        this.gameActive = false;
        this.stopTimer();
        
        const cellElement = this.getCellElement(row, col);
        cellElement.classList.add('exploded');
        
        setTimeout(() => {
            this.revealAllMines();
        }, 500);
        
        this.gameMessage.textContent = 'Вы, сопротивляясь, достаёте монокль из кармана и надеваете его на правый глаз.';
        this.gameMessage.className = 'game-message lose';
        
        anime({
            targets: this.gameMessage,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutElastic(1, .8)'
        });
    }
    
    revealAllMines() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = this.board[i][j];
                if (cell.isMine && !cell.isRevealed) {
                    const cellElement = this.getCellElement(i, j);
                    cellElement.classList.add('revealed', 'mine');
                    
                    const randomImage = this.mineImages[Math.floor(Math.random() * this.mineImages.length)];
                    cellElement.style.backgroundImage = `url('${randomImage}')`;
                    
                    setTimeout(() => {
                        cellElement.style.opacity = '0';
                        anime({
                            targets: cellElement,
                            opacity: 1,
                            scale: [0.5, 1],
                            duration: 300,
                            delay: Math.random() * 1000
                        });
                    }, Math.random() * 500);
                }
            }
        }
    }
    
    checkWinCondition() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        const totalCells = rows * cols;
        
        if (this.revealedCount === totalCells - this.totalMines) {
            this.gameActive = false;
            this.stopTimer();
            
            this.gameMessage.textContent = 'Вы не стали Амоном';
            this.gameMessage.className = 'game-message win';
            
            anime({
                targets: this.gameMessage,
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 500,
                easing: 'easeOutElastic(1, .8)'
            });
            
            const flagElements = document.querySelectorAll('.cell.flagged');
            anime({
                targets: flagElements,
                scale: [1, 1.2, 1],
                duration: 600,
                delay: anime.stagger(100),
                loop: 3
            });
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        if (this.startTime && this.gameActive) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timerDisplay.textContent = elapsed.toString().padStart(3, '0');
        } else {
            this.timerDisplay.textContent = '000';
        }
    }
    
    updateStats() {
        this.flagCountDisplay.textContent = this.flagCount;
        this.mineCountDisplay.textContent = this.totalMines;
    }
    
    getCellElement(row, col) {
        return this.gameBoard.children[row * this.difficulties[this.currentDifficulty].cols + col];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});
