// Shiv Chanting Portal - JavaScript
// Author: Senior Front-end Developer
// Purpose: Handle audio control, jap counter, timer, and localStorage functionality

class ShivChantingApp {
    constructor() {
        this.japCount = 0;
        this.totalJapa = 0;
        this.todayJapa = 0;
        this.malasCount = 0;
        this.isPlaying = false;
        this.startTime = null;
        this.timerInterval = null;
        this.currentTime = 0;
        this.isPageVisible = true;
        this.timerPaused = false;
        this.pausedTime = 0;
        
        this.loadData();
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.createBellSound();
        this.startAutoTimer();
        this.updateTimerButton(); // Set initial button state
        console.log('🕉️ Shiv Chanting Portal initialized successfully');
    }

    // Load data from localStorage
    loadData() {
        const savedData = localStorage.getItem('shivChantingData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.japCount = data.japCount || 0;
            this.totalJapa = data.totalJapa || 0;
            this.todayJapa = data.todayJapa || 0;
            this.malasCount = data.malasCount || 0;
        }
    }

    // Save data to localStorage
    saveData() {
        const data = {
            japCount: this.japCount,
            totalJapa: this.totalJapa,
            todayJapa: this.todayJapa,
            malasCount: this.malasCount
        };
        localStorage.setItem('shivChantingData', JSON.stringify(data));
    }

    // Setup all event listeners
    setupEventListeners() {
        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.resetAllData();
        });

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.toggleFullscreen();
        });

        // Progress circle click to play/pause audio
        const progressCircle = document.querySelector('.progress-circle');
        progressCircle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.toggleAudio();
        });

        // Timer control button
        const timerControlBtn = document.getElementById('timerControlBtn');
        timerControlBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.toggleTimer();
        });

        // Screen tap to increment count
        document.addEventListener('click', (e) => {
            // Only increment if not clicking on buttons or progress circle
            if (!e.target.closest('.reset-btn') && 
                !e.target.closest('.fullscreen-btn') && 
                !e.target.closest('.progress-circle')) {
                this.incrementCount();
            }
        });

        // Audio event listeners
        const audio = document.getElementById('mantraAudio');
        audio.addEventListener('ended', () => {
            audio.play();
        });

        audio.addEventListener('error', (e) => {
            console.warn('Audio file not found:', e);
            this.showAudioError();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Page visibility change events
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Page unload event
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });

        // Reset daily count at midnight
        this.setupDailyReset();
    }

    // Increment jap count
    incrementCount() {
        this.japCount++;
        this.totalJapa++;
        this.todayJapa++;

        // Check if completed one mala (108)
        if (this.japCount >= 108) {
            this.handleMalaCompletion();
        }

        this.updateDisplay();
        this.saveData();
        console.log(`Jap count: ${this.japCount}`);
    }

    // Handle mala completion
    handleMalaCompletion() {
        this.malasCount++;
        this.japCount = 0; // Reset for next mala
        
        // Play bell sound
        this.playBellSound();
        
        // Show completion message
        this.showCompletionMessage();
        
        this.updateDisplay();
        this.saveData();
        
        console.log(`🎉 Completed ${this.malasCount} malas!`);
    }

    // Toggle audio play/pause
    toggleAudio() {
        const audio = document.getElementById('mantraAudio');
        const progressCircle = document.querySelector('.progress-circle');

        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    // Toggle timer pause/resume
    toggleTimer() {
        if (this.timerPaused) {
            this.resumeTimer();
        } else {
            this.pauseTimer();
        }
    }

    // Pause timer
    pauseTimer() {
        this.timerPaused = true;
        this.pausedTime = this.currentTime;
        this.updateTimerButton();
        console.log('⏸️ Timer paused');
    }

    // Resume timer
    resumeTimer() {
        this.timerPaused = false;
        this.updateTimerButton();
        console.log('▶️ Timer resumed');
    }

    // Play audio
    playAudio() {
        const audio = document.getElementById('mantraAudio');
        const progressCircle = document.querySelector('.progress-circle');

        audio.play().then(() => {
            this.isPlaying = true;
            progressCircle.style.filter = 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.8))';
            console.log('🎵 Playing Sambh Sadashiv');
        }).catch(error => {
            console.error('Error playing audio:', error);
            this.showAudioError();
        });
    }

    // Pause audio
    pauseAudio() {
        const audio = document.getElementById('mantraAudio');
        const progressCircle = document.querySelector('.progress-circle');

        audio.pause();
        this.isPlaying = false;
        progressCircle.style.filter = 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.5))';
        console.log('⏸️ Paused audio');
    }

    // Start auto timer (starts immediately when page loads)
    startAutoTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.isPageVisible && !this.timerPaused) {
                this.currentTime++;
                this.updateTimerDisplay();
            }
        }, 1000);
        
        console.log('⏰ Auto timer started');
    }

    // Start timer (for audio playback)
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.isPageVisible && !this.timerPaused) {
                this.currentTime++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    // Stop timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Reset timer
    resetTimer() {
        this.currentTime = 0;
        this.pausedTime = 0;
        this.timerPaused = false;
        this.updateTimerDisplay();
        console.log('⏰ Timer reset');
    }

    // Update timer display
    updateTimerDisplay() {
        const hours = Math.floor(this.currentTime / 3600);
        const minutes = Math.floor((this.currentTime % 3600) / 60);
        const seconds = this.currentTime % 60;
        
        const timerDisplay = document.getElementById('timerDisplay');
        timerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update timer button icon
    updateTimerButton() {
        const timerControlBtn = document.getElementById('timerControlBtn');
        if (this.timerPaused) {
            timerControlBtn.textContent = '▶️';
            timerControlBtn.title = 'Resume Timer';
        } else {
            timerControlBtn.textContent = '⏸️';
            timerControlBtn.title = 'Pause Timer';
        }
    }

    // Update all displays
    updateDisplay() {
        // Update jap count
        const japCountElement = document.getElementById('japCount');
        japCountElement.textContent = this.japCount;

        // Update progress circle
        this.updateProgressCircle();

        // Update info cards
        document.getElementById('malasCount').textContent = this.malasCount;
        document.getElementById('totalJapa').textContent = this.totalJapa;
        document.getElementById('todayJapa').textContent = this.todayJapa;
    }

    // Update progress circle
    updateProgressCircle() {
        const circle = document.querySelector('.progress-ring-circle');
        const radius = 110; // Updated radius for larger circle
        const circumference = radius * 2 * Math.PI;
        const progress = (this.japCount / 108) * circumference;
        
        // Update stroke color based on progress
        if (this.japCount > 0) {
            circle.style.stroke = '#ff6b35'; // Orange when counting
        } else {
            circle.style.stroke = '#ffa500'; // Light orange when empty
        }
        
        // Ensure smooth circular fill
        circle.style.strokeDashoffset = circumference - progress;
        circle.style.strokeLinecap = 'round';
        circle.style.strokeLinejoin = 'round';
    }

    // Reset all data to 0
    resetAllData() {
        // Show confirmation
        if (confirm('Are you sure you want to reset all data? This will set all counts to 0.')) {
            this.japCount = 0;
            this.totalJapa = 0;
            this.todayJapa = 0;
            this.malasCount = 0;
            
            this.updateDisplay();
            this.saveData();
            
            // Show reset confirmation
            this.showResetMessage();
            
            console.log('🔄 All data reset to 0');
        }
    }

    // Show reset confirmation message
    showResetMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1.2rem;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: fadeInOut 2s ease forwards;
        `;
        
        message.textContent = `🔄 All Data Reset! 🔄`;
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }

    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Create and play bell sound
    createBellSound() {
        this.bellAudioContext = null;
    }

    playBellSound() {
        try {
            if (!this.bellAudioContext) {
                this.bellAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.bellAudioContext.createOscillator();
            const gainNode = this.bellAudioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.bellAudioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.bellAudioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.bellAudioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, this.bellAudioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.bellAudioContext.currentTime + 0.5);
            
            oscillator.start(this.bellAudioContext.currentTime);
            oscillator.stop(this.bellAudioContext.currentTime + 0.5);
            
        } catch (error) {
            console.warn('Could not play bell sound:', error);
            const bellAudio = document.getElementById('bell-sound');
            if (bellAudio) {
                bellAudio.play().catch(e => console.warn('Bell audio file not available'));
            }
        }
    }

    // Show completion message
    showCompletionMessage() {
        const japCountElement = document.getElementById('japCount');
        japCountElement.classList.add('completed');
        
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1.2rem;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: fadeInOut 3s ease forwards;
        `;
        
        message.textContent = `🎉 Mala Completed! 🎉`;
        document.body.appendChild(message);
        
        setTimeout(() => {
            japCountElement.classList.remove('completed');
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    // Show audio error message
    showAudioError() {
        const countBtn = document.getElementById('countBtn');
        const originalText = countBtn.textContent;
        
        countBtn.textContent = '⚠️ Audio Error';
        countBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        
        setTimeout(() => {
            countBtn.textContent = originalText;
            countBtn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        }, 2000);
    }

    // Setup daily reset
    setupDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.todayJapa = 0;
            this.saveData();
            this.updateDisplay();
            this.setupDailyReset(); // Setup for next day
        }, timeUntilMidnight);
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Space bar to play/pause
        if (e.code === 'Space') {
            e.preventDefault();
            this.toggleAudio();
        }
        
        // Enter or + key to increment count
        if (e.code === 'Enter' || e.code === 'Equal' || e.code === 'NumpadAdd') {
            e.preventDefault();
            this.incrementCount();
        }
        
        // F key for fullscreen
        if (e.code === 'KeyF') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    // Handle page visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Page went to background
            this.isPageVisible = false;
            this.timerPaused = true;
            console.log('⏸️ Timer paused - page in background');
        } else {
            // Page came to foreground
            this.isPageVisible = true;
            this.timerPaused = false;
            console.log('▶️ Timer resumed - page in foreground');
        }
    }

    // Handle page unload (user leaves the page)
    handlePageUnload() {
        this.resetTimer();
        this.stopTimer();
        console.log('⏰ Timer stopped and reset - user left page');
    }

    // Public method to get current state
    getState() {
        return {
            japCount: this.japCount,
            totalJapa: this.totalJapa,
            todayJapa: this.todayJapa,
            malasCount: this.malasCount,
            isPlaying: this.isPlaying
        };
    }
}

// Add CSS for completion animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shivChantingApp = new ShivChantingApp();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShivChantingApp;
}