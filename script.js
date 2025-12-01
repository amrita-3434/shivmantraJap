// Shiv Chanting Portal - JavaScript
// Author: Senior Front-end Developer
// Purpose: Handle audio control, jap counter, timer, and localStorage functionality

class ShivChantingApp {
    constructor() {
        // Current mantra data (will be loaded from storage)
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
        this.isManuallyMuted = false; // Track manual mute state
        this.isManuallyPaused = false; // Track manual timer pause state (mantra-specific)
        this.wasTimerRunningBeforeLeave = false; // Track if timer was running before leaving site
        this.hasStartedTimer = false; // Track if timer has been started by user tap
        
        // Mantra data structure
        this.mantras = {
            'sambh-sadashiv': {
                name: 'सांब सदाशिव',
                title: 'सांब सदाशिव',
                audio: 'assets/audio/sambhshadashiv.mp3',
                icon: '🕉️'
            },
            'om-namah-shivay': {
                name: 'ॐ नमः शिवाय',
                title: 'ॐ नमः शिवाय',
                audio: 'assets/audio/OmNamahShivay.mp3',
                icon: '🕉️'
            },
            'om': {
                name: 'ॐ',
                title: 'ॐ',
                audio: 'assets/audio/Omchant.mp3',
                icon: '🕉️'
            }
        };
        this.currentMantra = 'sambh-sadashiv'; // Default mantra
        
        this.loadData();
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateTimerDisplay(); // Display loaded timer state (shows 00:00:00 initially)
        this.updateTimerButton(); // Set initial button state
        this.updateAudioButton(); // Set initial audio button state
        this.updateMantraDisplay(); // Update mantra display
        
        // Don't start timer automatically - wait for first user tap
        // Timer will start on first screen tap
        
        // Load audio and prepare it (respect manual mute state)
        const audio = document.getElementById('mantraAudio');
        if (!this.isManuallyMuted) {
            // Preload and prepare audio, but don't autoplay (browser policy)
            // Audio will start on first user interaction
            audio.load();
            audio.muted = false;
            // Try to play, but don't force it (will work after user interaction)
            audio.play().then(() => {
                this.isPlaying = true;
                this.updateAudioButton();
                console.log('🎵 Audio started on page load');
            }).catch(() => {
                // Expected - browsers block autoplay, will play on first click
                this.isPlaying = false;
                this.updateAudioButton();
                console.log('⏸️ Audio ready, waiting for user interaction');
            });
        } else {
            // If manually muted, keep it muted
            audio.muted = true;
            audio.pause();
            this.isPlaying = false;
        }
        
        console.log('🕉️ Shiv Chanting Portal initialized successfully');
        console.log(`⏱️ Timer loaded: ${this.currentTime}s, Paused: ${this.timerPaused}`);
    }

    // Load data from localStorage
    loadData() {
        const savedData = localStorage.getItem('shivChantingData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Load global settings
            this.isManuallyMuted = data.isManuallyMuted || false;
            this.currentMantra = data.currentMantra || 'sambh-sadashiv';
            
            // Load mantra-specific data
            this.mantraData = data.mantraData || {};
            
            // Initialize all mantras with timer data if not exists
            Object.keys(this.mantras).forEach(mantraKey => {
                if (!this.mantraData[mantraKey]) {
                    this.mantraData[mantraKey] = {
                        japCount: 0,
                        totalJapa: 0,
                        todayJapa: 0,
                        malasCount: 0,
                        currentTime: 0,
                        timerPaused: false,
                        pausedTime: 0,
                        isManuallyPaused: false
                    };
                } else {
                    // Ensure timer fields exist
                    if (this.mantraData[mantraKey].currentTime === undefined) {
                        this.mantraData[mantraKey].currentTime = 0;
                    }
                    if (this.mantraData[mantraKey].timerPaused === undefined) {
                        this.mantraData[mantraKey].timerPaused = false;
                    }
                    if (this.mantraData[mantraKey].pausedTime === undefined) {
                        this.mantraData[mantraKey].pausedTime = 0;
                    }
                    if (this.mantraData[mantraKey].isManuallyPaused === undefined) {
                        this.mantraData[mantraKey].isManuallyPaused = false;
                    }
                }
            });
            
			// On fresh load, always start timers from 0 for all mantras
			Object.keys(this.mantraData).forEach(mantraKey => {
				this.mantraData[mantraKey].currentTime = 0;
				this.mantraData[mantraKey].pausedTime = 0;
			});
			
			// Load current mantra data
            const currentMantraData = this.mantraData[this.currentMantra];
			this.japCount = currentMantraData.japCount || 0;
            this.totalJapa = currentMantraData.totalJapa || 0;
            this.todayJapa = currentMantraData.todayJapa || 0;
            this.malasCount = currentMantraData.malasCount || 0;
			this.currentTime = 0; // start from 0 sec on new visit
            this.timerPaused = currentMantraData.timerPaused || false;
			this.pausedTime = 0;
            this.isManuallyPaused = currentMantraData.isManuallyPaused || false;
        } else {
            // Initialize mantra data structure with timer data
            this.mantraData = {
                'sambh-sadashiv': { 
                    japCount: 0, totalJapa: 0, todayJapa: 0, malasCount: 0,
                    currentTime: 0, timerPaused: false, pausedTime: 0, isManuallyPaused: false
                },
                'om-namah-shivay': { 
                    japCount: 0, totalJapa: 0, todayJapa: 0, malasCount: 0,
                    currentTime: 0, timerPaused: false, pausedTime: 0, isManuallyPaused: false
                },
                'om': { 
                    japCount: 0, totalJapa: 0, todayJapa: 0, malasCount: 0,
                    currentTime: 0, timerPaused: false, pausedTime: 0, isManuallyPaused: false
                }
            };
        }
    }

    // Save data to localStorage
    saveData() {
        // Update current mantra data (including timer data)
        this.mantraData[this.currentMantra] = {
            japCount: this.japCount,
            totalJapa: this.totalJapa,
            todayJapa: this.todayJapa,
            malasCount: this.malasCount,
            currentTime: this.currentTime,
            timerPaused: this.timerPaused,
            pausedTime: this.pausedTime,
            isManuallyPaused: this.isManuallyPaused
        };
        
        const data = {
            isManuallyMuted: this.isManuallyMuted,
            currentMantra: this.currentMantra,
            mantraData: this.mantraData
        };
        localStorage.setItem('shivChantingData', JSON.stringify(data));
    }

    // Setup all event listeners
    setupEventListeners() {
        // Hamburger menu
        this.setupHamburgerMenu();
        
        // Navigation links
        this.setupNavigationLinks();
        
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

        // Progress circle - no special handling, let it trigger screen tap

        // Timer control button
        const timerControlBtn = document.getElementById('timerControlBtn');
        timerControlBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.toggleTimer();
        });

        // Audio control button
        const audioControlBtn = document.getElementById('audioControlBtn');
        audioControlBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.toggleAudio();
        });

        // Mantra selector button
        const mantraSelectorBtn = document.getElementById('mantraSelectorBtn');
        mantraSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering screen tap
            this.toggleMantraDropdown();
        });

        // Screen tap to increment count
		document.addEventListener('click', (e) => {
            // If mantra selector is open, do NOT count any clicks
            if (document.querySelector('.mantra-selector-modal') || document.querySelector('.mantra-selector-dropdown')) {
				return;
			}
			// Only increment if not clicking on control buttons or info cards
			// Tap anywhere (except controls and cards) should increment count for all mantras
			if (!e.target.closest('.reset-btn') && 
				!e.target.closest('.fullscreen-btn') && 
				!e.target.closest('.timer-control-btn') &&
				!e.target.closest('.audio-control-btn') &&
				!e.target.closest('.mantra-selector-btn') &&
				!e.target.closest('.info-card') &&
				!e.target.closest('.data-analysis-section') &&
				!e.target.closest('.nav-link') &&
				!e.target.closest('.nav-header') &&
				!e.target.closest('.hamburger-menu')) {
				this.incrementCount(e);
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

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const dropdown = document.querySelector('.mantra-selector-dropdown');
            const button = document.getElementById('mantraSelectorBtn');
            if (dropdown && !dropdown.contains(e.target) && !button.contains(e.target)) {
                this.closeMantraDropdown();
            }
        });

        // Page visibility change events
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Page unload event
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });

        // Additional event for when user navigates away
        window.addEventListener('unload', () => {
            this.pauseAudio();
        });

        // Reset daily count at midnight
        this.setupDailyReset();
        
        // Recalculate progress circle on window resize (for responsive radius changes)
        window.addEventListener('resize', () => {
            this.updateProgressCircle();
        });
        
        // Detect scroll to section 2 and update button styles
        this.setupSection2ScrollDetection();
    }
    
    // Setup scroll detection for section 2
    setupSection2ScrollDetection() {
        const section2 = document.getElementById('section2');
        if (!section2) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Section 2 is in view - add class to body
                    document.body.classList.add('in-section2');
                } else {
                    // Section 2 is not in view - remove class from body
                    document.body.classList.remove('in-section2');
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of section 2 is visible
        });
        
        observer.observe(section2);
        
        // Also check on initial load
        const rect = section2.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
            document.body.classList.add('in-section2');
        }
    }

    // Setup hamburger menu functionality
    setupHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const navLinks = document.getElementById('navLinks');
        const navOverlay = document.getElementById('navOverlay');
        
        if (hamburgerMenu && navLinks) {
            hamburgerMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHamburgerMenu();
            });
            
            // Close menu when clicking overlay
            if (navOverlay) {
                navOverlay.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        this.closeHamburgerMenu();
                    }
                });
            }
            
            // Close menu when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (navLinks.classList.contains('active') && 
                        !navLinks.contains(e.target) && 
                        !hamburgerMenu.contains(e.target)) {
                        this.closeHamburgerMenu();
                    }
                }
            });
            
            // Close menu when a nav link is clicked on mobile
            const navLinksItems = navLinks.querySelectorAll('.nav-link');
            navLinksItems.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        this.closeHamburgerMenu();
                    }
                });
            });
            
            // Close menu when window is resized from mobile to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                    this.closeHamburgerMenu();
                }
            });
        }
    }
    
    // Toggle hamburger menu
    toggleHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const navLinks = document.getElementById('navLinks');
        const navOverlay = document.getElementById('navOverlay');
        
        if (hamburgerMenu && navLinks) {
            hamburgerMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (navOverlay) {
                navOverlay.classList.toggle('active');
            }
        }
    }
    
    // Close hamburger menu
    closeHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const navLinks = document.getElementById('navLinks');
        const navOverlay = document.getElementById('navOverlay');
        
        if (hamburgerMenu && navLinks) {
            hamburgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            if (navOverlay) {
                navOverlay.classList.remove('active');
            }
        }
    }

    // Setup navigation links functionality
    setupNavigationLinks() {
        const homeLink = document.getElementById('homeLink');
        const blogLink = document.getElementById('blogLink');
        const homeSection = document.getElementById('homeSection');
        const blogSection = document.getElementById('blogSection');
        
        // Home link - show home section
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showHomeSection();
            });
        }
        
        // Blog link - show blog section
        if (blogLink) {
            blogLink.addEventListener('click', (e) => {
                // Only intercept click if in-page blog section exists; otherwise allow normal navigation
                if (document.getElementById('blogSection')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showBlogSection();
                }
            });
        }
        
    }
    
    // Show home section
    showHomeSection() {
        const homeSection = document.getElementById('homeSection');
        const blogSection = document.getElementById('blogSection');
        const homeLink = document.getElementById('homeLink');
        const blogLink = document.getElementById('blogLink');
        
        if (homeSection) {
            homeSection.style.display = 'flex';
            if (blogSection) blogSection.style.display = 'none';
            
            // Update active state
            if (homeLink && blogLink) {
                homeLink.classList.add('active');
                blogLink.classList.remove('active');
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Show blog section
    showBlogSection() {
        const homeSection = document.getElementById('homeSection');
        const blogSection = document.getElementById('blogSection');
        const homeLink = document.getElementById('homeLink');
        const blogLink = document.getElementById('blogLink');
        
        if (homeSection && blogSection) {
            homeSection.style.display = 'none';
            blogSection.style.display = 'flex';
            
            // Update active state
            if (homeLink && blogLink) {
                homeLink.classList.remove('active');
                blogLink.classList.add('active');
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Increment jap count
    incrementCount(event = null) {
        // Start timer on first tap if not started yet and not paused
        if (!this.hasStartedTimer && !this.timerPaused) {
            this.hasStartedTimer = true;
            this.startAutoTimer();
            console.log('⏰ Timer started on first tap');
        }
        
        // Spread mantra name upward when tapped
        this.spreadMantraName(event);
        
        this.japCount++;
        this.totalJapa++;
        this.todayJapa++;

        // Update display first to show 108
        this.updateDisplay();
        this.saveData();
        
        // Check if completed one mala (exactly at 108)
        if (this.japCount === 108) {
            // Show 108 for a moment, then handle completion
            setTimeout(() => {
                this.handleMalaCompletion();
            }, 100); // Small delay to ensure 108 is visible
        }
        
        console.log(`Jap count: ${this.japCount}`);
    }

    // Handle mala completion
    handleMalaCompletion() {
        this.malasCount++;
        
        // Spread flowers immediately when 108 count happens
        this.spreadFlowers();
        
        // Reset count to 0 after a delay (to show 108 for some time)
        setTimeout(() => {
            this.japCount = 0;
            // Update display to show empty circle and 0 count
            this.updateDisplay();
            this.saveData();
        }, 500); // Delay before resetting to 0
        
        console.log(`🎉 Completed ${this.malasCount} malas!`);
    }

    // Spread mantra name upward when screen is tapped
    spreadMantraName(event = null) {
        const currentMantraData = this.mantras[this.currentMantra];
        if (!currentMantraData) return;

        const mantraName = currentMantraData.name;
        
        // Get the tap position - use actual tap position if available, otherwise center
        let tapX, tapY;
        if (event && event.clientX && event.clientY) {
            tapX = event.clientX;
            tapY = event.clientY;
        } else {
            // Fallback to center if no event data
            tapX = window.innerWidth / 2;
            tapY = window.innerHeight / 2;
        }

        // Adjust font size based on mantra - smaller for longer mantras
        // Also adjust for mobile screens
        const screenWidth = window.innerWidth;
        let fontSize;
        
        if (this.currentMantra === 'sambh-sadashiv' || this.currentMantra === 'om-namah-shivay') {
            // Smaller for Sambh Sadashiv and Om Namah Shivay
            if (screenWidth <= 480) {
                fontSize = '1.2rem'; // Small mobile
            } else if (screenWidth <= 768) {
                fontSize = '1.4rem'; // Tablet
            } else {
                fontSize = '1.6rem'; // Desktop
            }
        } else {
            // Keep larger size for Om (shorter text)
            if (screenWidth <= 480) {
                fontSize = '1.8rem'; // Small mobile
            } else if (screenWidth <= 768) {
                fontSize = '2rem'; // Tablet
            } else {
                fontSize = '2.5rem'; // Desktop
            }
        }

        // Create mantra name element
        const mantraElement = document.createElement('div');
        mantraElement.className = 'mantra-spread-item';
        mantraElement.textContent = mantraName;
        
        // Random horizontal offset for spreading effect
        const randomOffset = (Math.random() - 0.5) * 200; // -100 to +100px
        
        mantraElement.style.cssText = `
            position: fixed;
            left: ${tapX}px;
            top: ${tapY}px;
            font-size: ${fontSize};
            font-weight: 700;
            color: #ffd700;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5);
            z-index: 9999;
            pointer-events: none;
            white-space: nowrap;
            transform: translate(-50%, -50%);
            --start-x: 0px;
            --start-y: 0px;
            --end-x: ${randomOffset}px;
            --end-y: -${window.innerHeight * 0.4}px;
            --duration: 2000ms;
            font-family: 'Poppins', sans-serif;
        `;
        
        document.body.appendChild(mantraElement);
        
        // Remove element after animation completes
        setTimeout(() => {
            if (mantraElement.parentNode) {
                mantraElement.parentNode.removeChild(mantraElement);
            }
        }, 2200);
    }

    // Spread flowers/leaves/beads around circle when 108 count completes
    spreadFlowers() {
        const progressCircle = document.querySelector('.progress-circle-container');
        if (!progressCircle) return;

        const circleRect = progressCircle.getBoundingClientRect();
        const circleCenterX = circleRect.left + circleRect.width / 2;
        const circleCenterY = circleRect.top + circleRect.height / 2;
        const circleRadius = 125; // Circle radius

        // Types of items: yellow flowers, leaves, and beads (15-16 items)
        const itemTypes = ['🌼', '🌻', '🌼', '🌻', '🌼', '🌻', '🌼', '🌻', '🌼', '🌻', '🌼', '🌻', '🌼', '🌻', '🌼', '🌻'];
        
        // Total 15-16 items
        const itemCount = 16;
        
        // Create and position items in a mala-like pattern (chain going upward)
        for (let i = 0; i < itemCount; i++) {
            // Starting from circle center/bottom, creating a mala chain pattern going upward
            // Start position: around the circle (mostly from bottom)
            const startAngle = -90 + (i * 60 / itemCount) * 6; // Spread from bottom in a wider arc
            const startAngleRad = (startAngle * Math.PI) / 180;
            
            // Starting position on circle edge (from bottom area)
            const startX = Math.cos(startAngleRad) * circleRadius;
            const startY = Math.sin(startAngleRad) * circleRadius;
            
            // Mala pattern: create a flowing chain upward with slight curve
            // Each item follows the previous one like beads in a garland
            const baseUpwardDistance = 120 + (i * 15); // Progressive upward movement
            const curveOffset = Math.sin(i * 0.3) * 40; // Slight wave/curve pattern
            
            // Calculate end position - flowing upward like a mala
            const endX = startX + curveOffset + (Math.random() * 40 - 20); // Slight curve
            const endY = startY - baseUpwardDistance - (i * 8); // Chain-like upward movement
            
            // Calculate middle positions for smooth continuous animation
            const midX = startX + (endX - startX) * 0.2; // 20% position
            const midY = startY + (endY - startY) * 0.2;
            const mid2X = startX + (endX - startX) * 0.4; // 40% position
            const mid2Y = startY + (endY - startY) * 0.4;
            const mid3X = startX + (endX - startX) * 0.6; // 60% position for gradual fade
            const mid3Y = startY + (endY - startY) * 0.6;
            
            // Create yellow flower element with bigger size
            const item = document.createElement('div');
            item.className = 'flower-item';
            item.textContent = itemTypes[i];
            const flowerSize = 36 + Math.random() * 16; // Bigger size (36-52px)
            item.style.cssText = `
                position: fixed;
                left: ${circleCenterX}px;
                top: ${circleCenterY}px;
                font-size: ${flowerSize}px;
                filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4));
                z-index: 9999;
                pointer-events: none;
                --start-x: ${startX}px;
                --start-y: ${startY}px;
                --mid-x: ${midX}px;
                --mid-y: ${midY}px;
                --mid2-x: ${mid2X}px;
                --mid2-y: ${mid2Y}px;
                --mid3-x: ${mid3X}px;
                --mid3-y: ${mid3Y}px;
                --end-x: ${endX}px;
                --end-y: ${endY}px;
                --duration: ${1500 + Math.random() * 400}ms;
            `;
            
            document.body.appendChild(item);
            
            // Remove element after animation completes (faster)
            setTimeout(() => {
                if (item.parentNode) {
                    item.parentNode.removeChild(item);
                }
            }, 2200);
        }
    }

    // Toggle audio mute/unmute
    toggleAudio() {
        const audio = document.getElementById('mantraAudio');
        const progressCircle = document.querySelector('.progress-circle');

        // Check if audio is currently playing (not paused and not muted)
        const isCurrentlyPlaying = !audio.paused && !audio.muted && this.isPlaying;
        
        if (isCurrentlyPlaying || (!audio.muted && !this.isManuallyMuted)) {
            // Mute audio
            audio.pause();
            audio.muted = true;
            this.isPlaying = false;
            this.isManuallyMuted = true; // User manually muted
            progressCircle.style.filter = 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.5))';
            console.log('🔇 Audio muted');
        } else {
            // Unmute and play audio
            this.isManuallyMuted = false; // User manually unmuted
            audio.muted = false;
            
            // Ensure audio is loaded before playing
            if (audio.readyState < 2) {
                audio.load();
            }
            
            // Play audio - handle promise properly
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    progressCircle.style.filter = 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.8))';
                    this.updateAudioButton();
                    console.log('🔊 Audio unmuted and playing');
                }).catch(err => {
                    // If play fails, try loading first then playing
                    audio.load();
                    audio.play().then(() => {
                        this.isPlaying = true;
                        progressCircle.style.filter = 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.8))';
                        this.updateAudioButton();
                        console.log('🔊 Audio unmuted and playing (after reload)');
                    }).catch(err2 => {
                        console.warn('Audio could not start playback:', err2);
                        this.isPlaying = false;
                        this.updateAudioButton();
                    });
                });
            } else {
                // Fallback for older browsers
                this.isPlaying = !audio.paused;
                this.updateAudioButton();
            }
        }
        
        this.updateAudioButton();
        this.saveData(); // Save mute state
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
        this.isManuallyPaused = true; // User manually paused
        this.updateTimerButton();
        this.saveData(); // Save pause state
        console.log('⏸️ Timer paused');
    }

    // Resume timer
    resumeTimer() {
        this.timerPaused = false;
        this.isManuallyPaused = false; // User manually resumed
        
        // Mark timer as started if not already started
        if (!this.hasStartedTimer) {
            this.hasStartedTimer = true;
        }
        
        // Start timer if it's not already running
        if (!this.timerInterval) {
            this.startAutoTimer();
        }
        
        this.updateTimerButton();
        this.saveData(); // Save resume state
        console.log('▶️ Timer resumed');
    }

    // Play audio
    playAudio() {
        const audio = document.getElementById('mantraAudio');
        const progressCircle = document.querySelector('.progress-circle');

        // Ensure audio is loaded before playing
        if (audio.readyState < 2) {
            audio.load();
        }
        
        audio.muted = false; // Unmute audio
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                progressCircle.style.filter = 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.8))';
                this.updateAudioButton(); // Update button state
                console.log('🎵 Playing audio');
            }).catch(error => {
                // If play fails, try loading first
                audio.load();
                audio.play().then(() => {
                    this.isPlaying = true;
                    progressCircle.style.filter = 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.8))';
                    this.updateAudioButton();
                    console.log('🎵 Playing audio (after reload)');
                }).catch(err => {
                    console.error('Error playing audio:', err);
                    this.showAudioError();
                });
            });
        }
    }

    // Pause audio
    pauseAudio() {
        const audio = document.getElementById('mantraAudio');
        const progressCircle = document.querySelector('.progress-circle');

        audio.pause();
        audio.muted = true; // Mute audio when paused
        this.isPlaying = false;
        progressCircle.style.filter = 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.5))';
        this.updateAudioButton(); // Update button state
        console.log('⏸️ Paused audio');
    }

    // Start auto timer (starts immediately when page loads)
    startAutoTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.startTime = Date.now();
        let saveCounter = 0; // Save every 5 seconds
        this.timerInterval = setInterval(() => {
            if (this.isPageVisible && !this.timerPaused) {
                this.currentTime++;
                this.updateTimerDisplay();
                
                // Save timer data every 5 seconds
                saveCounter++;
                if (saveCounter >= 5) {
                    this.saveData();
                    saveCounter = 0;
                }
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
        this.hasStartedTimer = false; // Reset timer start flag
        this.stopTimer(); // Stop the timer interval
        this.updateTimerDisplay();
        this.updateTimerButton();
        console.log('⏰ Timer reset');
    }

    // Update timer display
    updateTimerDisplay() {
        // Always show 00:00:00 if timer hasn't started yet (and not manually paused)
        // If manually paused, show the paused time
        if (!this.hasStartedTimer && !this.isManuallyPaused) {
            const timerDisplay = document.getElementById('timerDisplay');
            timerDisplay.textContent = '00:00:00';
            return;
        }
        
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

    // Update audio control button icon
    updateAudioButton() {
        const audioControlBtn = document.getElementById('audioControlBtn');
        if (this.isPlaying) {
            audioControlBtn.textContent = '🔊';
            audioControlBtn.title = 'Mute Audio';
        } else {
            audioControlBtn.textContent = '🔇';
            audioControlBtn.title = 'Unmute Audio';
        }
    }

    // Update mantra display
    updateMantraDisplay() {
        const currentMantraData = this.mantras[this.currentMantra];
        const titleText = document.querySelector('.title-text');
        if (titleText) {
            titleText.textContent = currentMantraData.title;
        }
        
        // Update audio source
        const audio = document.getElementById('mantraAudio');
        const wasPlaying = !audio.paused && !audio.muted && this.isPlaying;
        audio.src = currentMantraData.audio;
        
        // Load and play the new audio if not manually muted
        if (!this.isManuallyMuted) {
            audio.load(); // Load the new source
            audio.muted = false; // Ensure it's not muted
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    this.updateAudioButton();
                    console.log(`🎵 Playing ${currentMantraData.name}`);
                }).catch(error => {
                    // If play fails, try loading again
                    audio.load();
                    audio.play().then(() => {
                        this.isPlaying = true;
                        this.updateAudioButton();
                        console.log(`🎵 Playing ${currentMantraData.name} (after reload)`);
                    }).catch(err => {
                        console.error('Error playing audio:', err);
                        this.showAudioError();
                    });
                });
            }
        } else {
            // If manually muted, keep it muted but load the new source
            audio.load();
            audio.muted = true;
            audio.pause();
            this.isPlaying = false;
        }
        
        // Update mantra selector display (label + arrow)
        const mantraSelectorBtn = document.getElementById('mantraSelectorBtn');
        const labelEl = document.getElementById('mantraSelectorLabel');
        const arrowEl = document.getElementById('mantraSelectorArrow');
        if (labelEl) {
            labelEl.textContent = currentMantraData.name;
        } else {
            // Fallback to text if label not present
            mantraSelectorBtn.textContent = `${currentMantraData.name} ▾`;
        }
        if (arrowEl) {
            arrowEl.textContent = '▾';
        }
        mantraSelectorBtn.title = `Current: ${currentMantraData.name} - Click to change`;
    }

    // Dropdown mantra selector below the top-right button
    toggleMantraDropdown() {
        const existing = document.querySelector('.mantra-selector-dropdown');
        if (existing) {
            this.closeMantraDropdown();
        } else {
            this.openMantraDropdown();
        }
    }

    openMantraDropdown() {
        const button = document.getElementById('mantraSelectorBtn');
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const dropdown = document.createElement('div');
        dropdown.className = 'mantra-selector-dropdown';
        dropdown.style.cssText = `
            position: fixed;
            top: ${Math.round(rect.bottom + 8)}px;
            right: ${Math.round(window.innerWidth - rect.right)}px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 14px;
            padding: 0.8rem;
            width: 260px;
            max-width: calc(100vw - 40px);
            box-shadow: 0 14px 40px rgba(0,0,0,0.45);
            border: 1px solid rgba(255, 255, 255, 0.12);
            z-index: 1600;
        `;

        const list = document.createElement('div');
        list.style.cssText = `display: flex; flex-direction: column; gap: 0.6rem;`;

        Object.entries(this.mantras).forEach(([key, mantra]) => {
            const isCurrent = this.currentMantra === key;
            const btn = document.createElement('button');
            btn.className = 'mantra-option';
            btn.dataset.mantra = key;
            btn.style.cssText = `
                background: ${isCurrent ? 'linear-gradient(45deg, #ff6b35, #f7931e)' : 'rgba(255,255,255,0.08)'};
                border: 1px solid rgba(255,255,255,0.18);
                border-radius: 12px;
                padding: 0.8rem 1rem;
                color: #fff;
                text-align: left;
                cursor: pointer;
                transition: all 0.25s ease;
                display: flex; align-items: center; gap: 0.75rem;
                font-size: 1rem;
            `;
            btn.innerHTML = `
                <span style="font-size:1.3rem;">${mantra.icon}</span>
                <span style="flex:1;">${mantra.name}</span>
                ${isCurrent ? '<span style="font-size:0.8rem;color:#ffd700;">Current</span>' : ''}
            `;
            btn.addEventListener('mouseenter', () => {
                if (!isCurrent) btn.style.background = 'rgba(255,255,255,0.14)';
            });
            btn.addEventListener('mouseleave', () => {
                if (!isCurrent) btn.style.background = 'rgba(255,255,255,0.08)';
            });
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchMantra(key);
                this.closeMantraDropdown();
            });
            list.appendChild(btn);
        });

        dropdown.appendChild(list);
        document.body.appendChild(dropdown);
    }

    closeMantraDropdown() {
        const existing = document.querySelector('.mantra-selector-dropdown');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }

    // Switch mantra
    switchMantra(mantraKey) {
        // Stop current timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Save current mantra data (including timer) before switching
        this.mantraData[this.currentMantra] = {
            japCount: this.japCount,
            totalJapa: this.totalJapa,
            todayJapa: this.todayJapa,
            malasCount: this.malasCount,
            currentTime: this.currentTime,
            timerPaused: this.timerPaused,
            pausedTime: this.pausedTime,
            isManuallyPaused: this.isManuallyPaused
        };
        
        // Switch to new mantra
        this.currentMantra = mantraKey;
        
        // Load new mantra data
        if (!this.mantraData[this.currentMantra]) {
            this.mantraData[this.currentMantra] = {
                japCount: 0,
                totalJapa: 0,
                todayJapa: 0,
                malasCount: 0,
                currentTime: 0,
                timerPaused: false,
                pausedTime: 0,
                isManuallyPaused: false
            };
        }
        
        const newMantraData = this.mantraData[this.currentMantra];
        this.japCount = newMantraData.japCount || 0;
        this.totalJapa = newMantraData.totalJapa || 0;
        this.todayJapa = newMantraData.todayJapa || 0;
        this.malasCount = newMantraData.malasCount || 0;
        
        // Load timer data for new mantra
        this.currentTime = newMantraData.currentTime || 0;
        this.timerPaused = newMantraData.timerPaused || false;
        this.pausedTime = newMantraData.pausedTime || 0;
        this.isManuallyPaused = newMantraData.isManuallyPaused || false;
        
        // Reset timer start flag for new mantra (user needs to tap again)
        this.hasStartedTimer = false;
        
        // Update timer display
        this.updateTimerDisplay();
        this.updateTimerButton();
        
        // Don't auto-start timer - wait for first tap
        
        // Update display with new data
        this.updateMantraDisplay();
        this.updateDisplay();
        this.saveData();
        
        console.log(`🕉️ Switched to: ${this.mantras[mantraKey].name}`);
        console.log(`📊 Data loaded: ${this.japCount} japa, ${this.malasCount} malas`);
        console.log(`⏱️ Timer: ${this.currentTime}s, Paused: ${this.timerPaused}`);
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
        
        // Update data analysis section
        this.updateDataAnalysis();
    }

    // Update data analysis section with all mantra totals
    updateDataAnalysis() {
		// Get total japa for each mantra
		const sambhData = this.mantraData['sambh-sadashiv'] || { totalJapa: 0 };
		const omNamahData = this.mantraData['om-namah-shivay'] || { totalJapa: 0 };
		const omData = this.mantraData['om'] || { totalJapa: 0 };
		
		// Use live in-memory total for the currently active mantra to avoid off-by-one before save
		const totalsByMantra = {
			'sambh-sadashiv': this.currentMantra === 'sambh-sadashiv' ? this.totalJapa : (sambhData.totalJapa || 0),
			'om-namah-shivay': this.currentMantra === 'om-namah-shivay' ? this.totalJapa : (omNamahData.totalJapa || 0),
			'om': this.currentMantra === 'om' ? this.totalJapa : (omData.totalJapa || 0)
		};
		
		// Update display elements
		const totalJapaSambhEl = document.getElementById('totalJapaSambh');
		const totalJapaOmNamahEl = document.getElementById('totalJapaOmNamah');
		const totalJapaOmEl = document.getElementById('totalJapaOm');
		
		if (totalJapaSambhEl) {
			totalJapaSambhEl.textContent = (totalsByMantra['sambh-sadashiv'] || 0).toLocaleString();
		}
		if (totalJapaOmNamahEl) {
			totalJapaOmNamahEl.textContent = (totalsByMantra['om-namah-shivay'] || 0).toLocaleString();
		}
		if (totalJapaOmEl) {
			totalJapaOmEl.textContent = (totalsByMantra['om'] || 0).toLocaleString();
		}
    }

    // Update progress circle
    updateProgressCircle() {
        const circle = document.querySelector('.progress-ring-circle');
        if (!circle) return;
        
        // Get the actual radius based on screen size (matches CSS breakpoints)
        // Desktop: 118, Tablet/Mobile (≤768px): 105, Small Mobile (≤480px): 95
        let radius;
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) {
            radius = 95;
        } else if (screenWidth <= 768) {
            radius = 105;
        } else {
            radius = 118;
        }
        
        // Ensure radius attribute matches (for consistency)
        if (circle.getAttribute('r') !== radius.toString()) {
            circle.setAttribute('r', radius);
        }
        
        const circumference = radius * 2 * Math.PI;
        
        // Set strokeDasharray to the full circumference (required for animation)
        circle.style.strokeDasharray = circumference;
        
        // Calculate progress: fill circle as count goes from 0 to 108
        // When japCount is 0, progress is 0 (empty circle)
        // When japCount is 108, progress is circumference (full circle)
        const progress = (this.japCount / 108) * circumference;
        
        // Set strokeDashoffset: 
        // - When progress is 0, offset is circumference (empty)
        // - When progress is circumference, offset is 0 (full circle)
        circle.style.strokeDashoffset = circumference - progress;
        
        // Update stroke color based on progress
        if (this.japCount > 0) {
            circle.style.stroke = '#ff6b35'; // Orange when counting
        } else {
            circle.style.stroke = '#ffa500'; // Light orange when empty
        }
        
        // Ensure smooth circular fill
        circle.style.strokeLinecap = 'round';
        circle.style.strokeLinejoin = 'round';
    }

    // Reset all data to 0
    resetAllData() {
        const currentMantraName = this.mantras[this.currentMantra].name;
        // Show confirmation
        if (confirm(`Are you sure you want to reset all data for ${currentMantraName}? This will set all counts to 0 for this mantra only.`)) {
            this.japCount = 0;
            this.totalJapa = 0;
            this.todayJapa = 0;
            this.malasCount = 0;
            
            this.updateDisplay();
            this.saveData();
            
            // Show reset confirmation
            this.showResetMessage();
            
            console.log(`🔄 ${currentMantraName} data reset to 0`);
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
        
        const currentMantraName = this.mantras[this.currentMantra].name;
        message.textContent = `🔄 ${currentMantraName} Data Reset! 🔄`;
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

    // Bell sound removed per request


    // Completion popup removed per request

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
            // Page went to background - save timer state
            this.saveData();
            this.isPageVisible = false;
            // Remember if timer was running before leaving (only if not manually paused)
            this.wasTimerRunningBeforeLeave = !this.timerPaused && !this.isManuallyPaused;
            // Auto-pause timer when leaving site (if not manually paused)
            if (!this.isManuallyPaused) {
                this.timerPaused = true;
                console.log('⏸️ Timer auto-paused - page in background');
            } else {
                console.log('⏸️ Timer remains manually paused');
            }
            this.pauseAudio(); // Pause audio when leaving site
            console.log('🔇 Audio paused - page in background');
        } else {
            // Page came to foreground
            this.isPageVisible = true;
            // Auto-resume timer if it was running before leaving and not manually paused
            if (this.wasTimerRunningBeforeLeave && !this.isManuallyPaused) {
                this.timerPaused = false;
                // Ensure timer is marked as started if it was running
                if (!this.hasStartedTimer) {
                    this.hasStartedTimer = true;
                }
                // Restart timer if needed
                if (!this.timerInterval) {
                    this.startAutoTimer();
                }
                console.log('▶️ Timer auto-resumed - page in foreground');
            } else if (this.isManuallyPaused) {
                console.log('⏸️ Timer remains manually paused - user preference');
            } else {
                console.log('⏸️ Timer was already paused before leaving');
            }
            // Only resume audio if it was not manually muted
            if (!this.isManuallyMuted) {
                this.playAudio(); // Resume audio when returning to site
                console.log('🔊 Audio resumed - page in foreground');
            } else {
                console.log('🔇 Audio remains muted - user preference');
            }
        }
    }

    // Handle page unload (user leaves the page)
    handlePageUnload() {
        this.pauseAudio(); // Pause audio when user leaves site
        // Save timer state before leaving
        this.saveData();
        this.stopTimer();
        console.log('⏰ Timer state saved - user left page');
        console.log('🔇 Audio paused - user left page');
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