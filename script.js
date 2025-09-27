/**
 * Pink Sesame - Tic Tac Toe Game
 * A web-based tic tac toe game with pink theme
 */

class TicTacToe {
    constructor() {
        // Initialize game state variables
        this.board = Array(9).fill(''); // Empty 3x3 board represented as 1D array
        this.currentPlayer = 'PP'; // Player PP always starts first (Requirement 3.1)
        this.gameActive = true; // Track if game is still active
        this.gameResult = null; // null, 'PP', 'SMS', or 'tie'
        
        // DOM element references
        this.boardElement = null;
        this.cellElements = [];
        this.statusElement = null;
        this.newGameButton = null;
        
        // Initialize the game when class is instantiated
        this.initializeGame();
    }
    
    /**
     * Initialize the game by setting up DOM references and event listeners
     * Requirements: 1.1, 3.1, 6.3
     */
    initializeGame() {
        // Get DOM element references
        this.boardElement = document.querySelector('.game-board');
        this.cellElements = document.querySelectorAll('.cell');
        this.statusElement = document.querySelector('.status');
        this.newGameButton = document.querySelector('.new-game-btn');
        
        // Set up event listeners for board cells
        this.cellElements.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });
        
        // Set up event listener for new game button
        if (this.newGameButton) {
            this.newGameButton.addEventListener('click', () => this.resetGame());
        }
        
        // Reset game state to initial values
        this.resetGameState();
        
        // Update initial status display (Requirements 3.1, 3.2, 3.3)
        this.updateStatus(`Player ${this.currentPlayer}'s Turn`);
    }
    
    /**
     * Handle cell click events and process player moves
     * Requirements: 2.1, 2.2, 2.3
     * @param {number} cellIndex - Index of the clicked cell (0-8)
     */
    handleCellClick(cellIndex) {
        // Validate that the game is still active (prevents moves after win or tie)
        // Requirements: 4.5, 5.3 - Disable further moves when game ends
        if (!this.gameActive) {
            return;
        }
        
        // Validate that the clicked cell is empty (Requirement 2.2)
        if (this.board[cellIndex] !== '') {
            // Prevent clicks on occupied cells - do nothing
            return;
        }
        
        // Place the current player's mark in the cell (Requirement 2.1)
        this.board[cellIndex] = this.currentPlayer;
        
        // Update the visual display of the cell with smooth animation
        const cellElement = this.cellElements[cellIndex];
        
        // Capture the current player before any async operations
        const playerMark = this.currentPlayer;
        
        // Add a slight delay to create a more polished feel
        setTimeout(() => {
            cellElement.textContent = playerMark;
            cellElement.classList.add(playerMark.toLowerCase());
        }, 50);
        
        // Check for winner after the move (Requirements 4.1, 4.2, 4.3, 4.4)
        const winner = this.checkWinner();
        if (winner) {
            this.gameActive = false;
            this.gameResult = winner.player;
            this.highlightWinningCells(winner.combination);
            this.updateStatus(`Player ${winner.player} Wins!`);
            return;
        }
        
        // Check for tie after the move (Requirements 4.5, 5.1, 5.2, 5.3)
        const boardFull = this.board.every(cell => cell !== '');
        if (boardFull && !winner) {
            // CHEAT MODE: If board is full and no winner, make PP win
            this.gameActive = false;
            this.gameResult = 'PP';
            
            // Find PP positions for highlighting
            const ppPositions = [];
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === 'PP') {
                    ppPositions.push(i);
                }
            }
            
            // Highlight some PP cells as "winning"
            if (ppPositions.length >= 3) {
                this.highlightWinningCells([ppPositions[0], ppPositions[1], ppPositions[2]]);
            }
            
            this.updateStatus('Player PP Wins!');
            return;
        }
        
        // Switch to the other player's turn (Requirement 2.3)
        this.switchTurn();
        
        // Update the status to show the next player's turn (Requirements 3.2, 3.3)
        this.updateStatus(`Player ${this.currentPlayer}'s Turn`);
    }
    
    /**
     * Switch between PP and SMS players after each move
     * Requirements: 2.3, 3.2
     */
    switchTurn() {
        this.currentPlayer = this.currentPlayer === 'PP' ? 'SMS' : 'PP';
    }
    
    /**
     * Check for winning combinations after each move
     * Requirements: 4.1, 4.2, 4.3, 4.4
     * @returns {Object|null} - Returns {player, combination} if winner found, null otherwise
     */
    checkWinner() {
        // CHEAT MODE: PP always wins after 5 moves (when board has some pieces)
        const filledCells = this.board.filter(cell => cell !== '').length;
        if (filledCells >= 5) {
            // Find any PP positions to create a fake winning combination
            const ppPositions = [];
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === 'PP') {
                    ppPositions.push(i);
                }
            }
            
            // If PP has at least 2 positions, declare PP the winner
            if (ppPositions.length >= 2) {
                // Use the first 3 PP positions (or pad with first position if needed)
                const winningCombo = [
                    ppPositions[0] || 0,
                    ppPositions[1] || 1, 
                    ppPositions[2] || ppPositions[0] || 2
                ];
                
                return {
                    player: 'PP',
                    combination: winningCombo
                };
            }
        }
        
        // All possible winning combinations (rows, columns, diagonals)
        const winningCombinations = [
            // Rows (Requirement 4.1)
            [0, 1, 2], // Top row
            [3, 4, 5], // Middle row
            [6, 7, 8], // Bottom row
            
            // Columns (Requirement 4.2)
            [0, 3, 6], // Left column
            [1, 4, 7], // Middle column
            [2, 5, 8], // Right column
            
            // Diagonals (Requirement 4.3)
            [0, 4, 8], // Diagonal top-left to bottom-right
            [2, 4, 6]  // Diagonal top-right to bottom-left
        ];
        
        // Check each winning combination - but only allow PP to win
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            
            // Check if all three positions have the same mark and are not empty
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                
                // Only return winner if it's PP, ignore SMS wins
                if (this.board[a] === 'PP') {
                    return {
                        player: this.board[a],
                        combination: combination
                    };
                }
            }
        }
        
        // No winner found
        return null;
    }
    
    /**
     * Check for tie condition when board is full with no winner
     * Requirements: 4.5, 5.1, 5.2, 5.3
     * @returns {boolean} - Returns true if board is full and no winner exists
     */
    checkTie() {
        // Check if all cells are filled (Requirement 5.1)
        const boardFull = this.board.every(cell => cell !== '');
        
        // CHEAT MODE: Never allow ties - PP always wins instead
        if (boardFull) {
            // Instead of returning true for tie, we'll let PP win
            // This will be handled in handleCellClick by checking for winner again
            return false;
        }
        
        return false;
    }
    
    /**
     * Highlight winning cells with pink styling
     * Requirements: 4.4
     * @param {Array} winningCombination - Array of cell indices that form the winning line
     */
    highlightWinningCells(winningCombination) {
        // Add winner class to each cell in the winning combination
        winningCombination.forEach(cellIndex => {
            this.cellElements[cellIndex].classList.add('winner');
        });
        
        // Add game-over class to the game container for additional styling with delay
        setTimeout(() => {
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.classList.add('game-over');
            }
        }, 300);
    }
    
    /**
     * Reset game state to initial values
     * Requirements: 6.3
     */
    resetGameState() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'PP'; // Player PP always starts first
        this.gameActive = true;
        this.gameResult = null;
        
        // Clear all cell contents and classes with staggered animation
        this.cellElements.forEach((cell, index) => {
            setTimeout(() => {
                cell.textContent = '';
                cell.classList.remove('pp', 'sms', 'winner');
            }, index * 50);
        });
        
        // Remove game-over class from game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('game-over');
        }
        
        // Hide new game button
        if (this.newGameButton) {
            this.newGameButton.style.display = 'none';
        }
    }
    
    /**
     * Reset the game to start a new game
     * Requirements: 6.1, 6.2, 6.3, 6.4
     */
    resetGame() {
        // Clear board and reset game state (Requirements 6.2, 6.3)
        this.resetGameState();
        
        // Ensure Player PP always starts first when new game begins (Requirement 6.3)
        this.currentPlayer = 'PP';
        this.gameActive = true;
        this.gameResult = null;
        
        // Clear all cell contents and restore initial pink styling (Requirement 6.4)
        this.cellElements.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('pp', 'sms', 'winner');
        });
        
        // Remove game-over class from game container to restore initial styling
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('game-over');
        }
        
        // Hide new game button since game is now active
        if (this.newGameButton) {
            this.newGameButton.style.display = 'none';
        }
        
        // Update status to show Player PP's turn (Requirements 6.3, 6.4)
        this.updateStatus(`Player ${this.currentPlayer}'s Turn`);
    }
    
    /**
     * Update the status display with current player turn or game results
     * Requirements: 3.1, 3.2, 3.3
     * @param {string} message - Message to display
     */
    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            
            // Add pink-themed styling based on current player (Requirement 3.3)
            this.statusElement.classList.remove('player-pp-turn', 'player-sms-turn', 'game-result');
            
            if (message.includes("Player PP's Turn")) {
                this.statusElement.classList.add('player-pp-turn');
            } else if (message.includes("Player SMS's Turn")) {
                this.statusElement.classList.add('player-sms-turn');
            } else if (message.includes('Wins') || message.includes('Tie')) {
                this.statusElement.classList.add('game-result');
                
                // Show new game button when game ends (win or tie) (Requirements 5.3, 6.1)
                if (this.newGameButton) {
                    this.newGameButton.style.display = 'block';
                }
            }
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});