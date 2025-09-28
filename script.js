/**
 * Pink Sesame - Multiplayer Tic Tac Toe Game
 * A web-based multiplayer tic tac toe game with pink theme
 */

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD9Dp9JlaeCVCBq3gvfcWi5Eebx8qUUhWk",
    authDomain: "pink-tic-tac-toe-48ad6.firebaseapp.com",
    databaseURL: "https://pink-tic-tac-toe-48ad6-default-rtdb.firebaseio.com",
    projectId: "pink-tic-tac-toe-48ad6",
    storageBucket: "pink-tic-tac-toe-48ad6.firebasestorage.app",
    messagingSenderId: "383060671589",
    appId: "1:383060671589:web:a5caf4471bb46666dada8c"
};

// Initialize Firebase (with fallback for demo)
let database = null;
let isOnlineMode = false;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
    }
} catch (error) {
    console.log('Firebase not available, using local mode only');
}

class TicTacToe {
    constructor() {
        // Initialize game state variables
        this.board = Array(9).fill(''); // Empty 3x3 board represented as 1D array
        this.currentPlayer = 'PP'; // Player PP always starts first (Requirement 3.1)
        this.gameActive = true; // Track if game is still active
        this.gameResult = null; // null, 'PP', 'SMS', or 'tie'

        // Multiplayer variables
        this.gameMode = 'local'; // 'local', 'online'
        this.roomCode = null;
        this.playerRole = null; // 'PP' or 'SMS'
        this.isMyTurn = false;
        this.roomRef = null;
        this.playerId = this.generatePlayerId();

        // DOM element references
        this.boardElement = null;
        this.cellElements = [];
        this.statusElement = null;
        this.newGameButton = null;

        // Initialize the game when class is instantiated
        this.initializeGame();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
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

        // Setup multiplayer UI
        this.setupMultiplayerUI();
    }

    /**
     * Handle cell click events and process player moves
     * Requirements: 2.1, 2.2, 2.3
     * @param {number} cellIndex - Index of the clicked cell (0-8)
     */
    async handleCellClick(cellIndex) {
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

        // For online multiplayer, check if it's player's turn and make online move
        if (this.gameMode === 'online') {
            if (!this.isMyTurn) {
                return; // Not player's turn
            }

            const success = await this.makeOnlineMove(cellIndex);
            if (!success) {
                return; // Move failed
            }

            // Online move successful, game state will be synced via Firebase
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
        if (this.checkTie()) {
            this.gameActive = false;
            this.gameResult = 'tie';
            this.updateStatus('It\'s a Tie!');
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

        // Check each winning combination
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;

            // Check if all three positions have the same mark and are not empty
            if (this.board[a] &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]) {

                // Return the winning player and combination for highlighting
                return {
                    player: this.board[a],
                    combination: combination
                };
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

        // Only return true if board is full AND no winner exists
        // (checkWinner is called before checkTie, so if we reach here, no winner was found)
        return boardFull;
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

    // ===== MULTIPLAYER METHODS =====

    setupMultiplayerUI() {
        // Setup mode selection buttons
        document.getElementById('localGameBtn').addEventListener('click', () => this.startLocalGame());
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinRoom());
        document.getElementById('joinBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('leaveRoomBtn').addEventListener('click', () => this.leaveRoom());

        // Show multiplayer setup initially
        document.getElementById('multiplayerSetup').style.display = 'block';
        document.getElementById('gameScreen').style.display = 'none';
    }

    startLocalGame() {
        this.gameMode = 'local';
        this.playerRole = 'PP';
        this.isMyTurn = true;

        document.getElementById('multiplayerSetup').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        document.getElementById('playerLabel').textContent = 'Local Game';
        document.getElementById('roomInfo').textContent = '';

        this.resetGameState();
        this.updateStatus(`Player ${this.currentPlayer}'s Turn`);
    }

    async createRoom() {
        if (!database) {
            alert('Online multiplayer not available. Please use local game mode.');
            return;
        }

        this.gameMode = 'online';
        this.playerRole = 'PP';
        this.roomCode = this.generateRoomCode();

        // Show room creation UI
        document.getElementById('roomSetup').style.display = 'block';
        document.getElementById('roomCreate').style.display = 'block';
        document.getElementById('roomCode').textContent = this.roomCode;

        // Create room in Firebase
        this.roomRef = database.ref('rooms/' + this.roomCode);
        await this.roomRef.set({
            player1: this.playerId,
            player2: null,
            board: Array(9).fill(''),
            currentPlayer: 'PP',
            gameActive: true,
            gameResult: null,
            createdAt: Date.now()
        });

        // Listen for player 2 joining
        this.roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.player2 && !this.isMyTurn) {
                this.startOnlineGame();
            }
            if (data) {
                this.syncGameState(data);
            }
        });
    }

    showJoinRoom() {
        document.getElementById('roomSetup').style.display = 'block';
        document.getElementById('roomJoin').style.display = 'block';
    }

    async joinRoom() {
        if (!database) {
            alert('Online multiplayer not available. Please use local game mode.');
            return;
        }

        const roomCode = document.getElementById('roomCodeInput').value.toUpperCase();
        if (!roomCode || roomCode.length !== 6) {
            this.showJoinStatus('Please enter a valid 6-character room code', 'error');
            return;
        }

        this.roomCode = roomCode;
        this.roomRef = database.ref('rooms/' + roomCode);

        try {
            const snapshot = await this.roomRef.once('value');
            const data = snapshot.val();

            if (!data) {
                this.showJoinStatus('Room not found', 'error');
                return;
            }

            if (data.player2) {
                this.showJoinStatus('Room is full', 'error');
                return;
            }

            // Join the room
            this.gameMode = 'online';
            this.playerRole = 'SMS';

            await this.roomRef.update({
                player2: this.playerId
            });

            this.showJoinStatus('Joined successfully!', 'success');
            setTimeout(() => this.startOnlineGame(), 1000);

            // Listen for game updates
            this.roomRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.syncGameState(data);
                }
            });

        } catch (error) {
            this.showJoinStatus('Error joining room: ' + error.message, 'error');
        }
    }

    startOnlineGame() {
        document.getElementById('multiplayerSetup').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        document.getElementById('playerLabel').textContent = `You are: ${this.playerRole}`;
        document.getElementById('roomInfo').textContent = `Room: ${this.roomCode}`;

        this.isMyTurn = this.playerRole === 'PP';
        this.resetGameState();
        this.updateMultiplayerStatus();
    }

    async makeOnlineMove(cellIndex) {
        if (!this.isMyTurn || !this.roomRef) return false;

        try {
            const snapshot = await this.roomRef.once('value');
            const data = snapshot.val();

            if (!data || !data.gameActive || data.board[cellIndex] !== '') {
                return false;
            }

            // Update the move in Firebase
            const newBoard = [...data.board];
            newBoard[cellIndex] = this.playerRole;

            const winner = this.checkWinnerForBoard(newBoard);
            const isTie = newBoard.every(cell => cell !== '') && !winner;

            await this.roomRef.update({
                board: newBoard,
                currentPlayer: this.playerRole === 'PP' ? 'SMS' : 'PP',
                gameActive: !winner && !isTie,
                gameResult: winner ? winner.player : (isTie ? 'tie' : null)
            });

            return true;
        } catch (error) {
            console.error('Error making move:', error);
            return false;
        }
    }

    syncGameState(data) {
        if (!data) return;

        this.board = data.board || Array(9).fill('');
        this.currentPlayer = data.currentPlayer || 'PP';
        this.gameActive = data.gameActive !== false;
        this.gameResult = data.gameResult;

        // Update visual board
        this.cellElements.forEach((cell, index) => {
            cell.textContent = this.board[index];
            cell.classList.remove('pp', 'sms', 'winner');
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase());
            }
        });

        // Update turn status
        this.isMyTurn = this.gameActive && this.currentPlayer === this.playerRole;
        this.updateMultiplayerStatus();

        // Handle game end
        if (!this.gameActive) {
            if (this.gameResult && this.gameResult !== 'tie') {
                const winner = this.checkWinnerForBoard(this.board);
                if (winner) {
                    this.highlightWinningCells(winner.combination);
                }
                this.updateStatus(`Player ${this.gameResult} Wins!`);
            } else if (this.gameResult === 'tie') {
                this.updateStatus('It\'s a Tie!');
            }

            if (this.newGameButton) {
                this.newGameButton.style.display = 'block';
            }
        }
    }

    updateMultiplayerStatus() {
        if (this.gameMode === 'online') {
            if (this.gameActive) {
                if (this.isMyTurn) {
                    this.updateStatus('Your turn');
                } else {
                    this.updateStatus(`Waiting for ${this.currentPlayer}...`);
                }
            }
        } else {
            this.updateStatus(`Player ${this.currentPlayer}'s Turn`);
        }
    }

    checkWinnerForBoard(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]  // Diagonals
        ];

        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return {
                    player: board[a],
                    combination: combination
                };
            }
        }
        return null;
    }

    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    showJoinStatus(message, type) {
        const statusEl = document.getElementById('joinStatus');
        statusEl.textContent = message;
        statusEl.className = `join-status ${type}`;
    }

    leaveRoom() {
        if (this.roomRef) {
            this.roomRef.off();
            this.roomRef = null;
        }

        this.gameMode = 'local';
        this.roomCode = null;
        this.playerRole = null;
        this.isMyTurn = false;

        document.getElementById('multiplayerSetup').style.display = 'block';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('roomSetup').style.display = 'none';
        document.getElementById('roomCreate').style.display = 'none';
        document.getElementById('roomJoin').style.display = 'none';
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});