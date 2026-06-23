/**
 * Taipei MRT Rolling Stock Web Exhibition - Core JS Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModeToggle();
    initTabs();
    initAudioSynthesizers();
    initScrollAnimations();
});

/* ==========================================================================
   NAVIGATION LOGIC
   ========================================================================== */
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.getElementById('header');

    // Toggle Mobile Menu
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('open');
    });

    // Close mobile menu on link click & handle smooth scroll active state
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });

    // Header scroll background modification
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '8px 0';
            header.style.backgroundColor = 'rgba(0, 15, 20, 0.9)';
        } else {
            header.style.padding = '0';
            header.style.backgroundColor = 'rgba(10, 28, 36, 0.75)';
        }
    });
}

/* ==========================================================================
   EXPLORER/KIDS MODE TOGGLE
   ========================================================================== */
function initModeToggle() {
    const modeToggle = document.getElementById('modeToggle');
    const modeIcon = modeToggle.querySelector('.mode-icon');
    const modeText = modeToggle.querySelector('.mode-text');

    // Load saved preference
    const savedMode = localStorage.getItem('explorer-mode');
    if (savedMode === 'kids') {
        document.body.classList.add('kids-mode');
        modeIcon.textContent = '⚙️';
        modeText.textContent = '切換至專業研究版';
    }

    modeToggle.addEventListener('click', () => {
        const isKids = document.body.classList.toggle('kids-mode');
        
        if (isKids) {
            localStorage.setItem('explorer-mode', 'kids');
            modeIcon.textContent = '⚙️';
            modeText.textContent = '切換至專業研究版';
        } else {
            localStorage.setItem('explorer-mode', 'adult');
            modeIcon.textContent = '🐣';
            modeText.textContent = '切換至兒童探索版';
        }



        // Trigger resize on canvases because layouts might adjust slightly
        window.dispatchEvent(new Event('resize'));
    });
}

/* ==========================================================================
   TAB SYSTEM LOGIC
   ========================================================================== */
function initTabs() {
    const tabContainers = document.querySelectorAll('.train-info');
    
    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-btn');
        const tabContents = container.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Remove active class from all buttons and contents in this container
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked button and target content
                btn.classList.add('active');
                
                // Find content with ID in this specific block
                const activeContent = container.querySelector(`.tab-content[id*="${targetTab}"]`) || container.querySelector(`.tab-content[id="${targetTab}"]`);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });
    });
}
/* ==========================================================================
   WEB AUDIO API TRAIN MOTOR SYNTHESIZERS
   ========================================================================== */
function initAudioSynthesizers() {
    const players = document.querySelectorAll('.custom-player');
    
    players.forEach(player => {
        const audioId = player.getAttribute('data-audio');
        const playBtn = player.querySelector('.play-btn');
        const playIcon = player.querySelector('.play-icon');
        const pauseIcon = player.querySelector('.pause-icon');
        const canvas = player.querySelector('.waveform-canvas');
        const statusText = player.querySelector('.player-status');
        
        let audioCtx = null;
        let isPlaying = false;
        let synthesisInterval = null;
        let animationFrameId = null;
        let audioSources = []; // Hold synth nodes for stopping
        
        // Canvas Setup
        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;
        
        // Draw initial flatline wave
        drawFlatWave(ctx, width, height);
        
        playBtn.addEventListener('click', () => {
            if (!audioCtx) {
                // Initialize Audio Context on user gesture
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (isPlaying) {
                // STOPPING PLAYBACK
                stopSound();
            } else {
                // STARTING PLAYBACK
                startSound();
            }
        });
        
        function startSound() {
            isPlaying = true;
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            
            const isKids = document.body.classList.contains('kids-mode');
            
            if (isKids) {
                statusText.innerHTML = `🔊 嘟嘟！沒找到音檔，工程師用魔法波形為你<strong style="color:var(--color-petrol-hover)">模擬火車開動聲</strong>！`;
            } else {
                statusText.innerHTML = `⚠️ 未偵測到實體音檔，正在運行 Web Audio <strong style="color:var(--color-petrol-hover)">動態合成運轉聲</strong>...`;
            }
            
            if (audioId.includes('c321')) {
                playSiemensGTOSynth();
            } else if (audioId.includes('c381')) {
                playMitsubishiIGBTSynth();
            } else if (audioId.includes('c301')) {
                playWestinghouseGTOSynth(); // Custom C301 Westinghouse "flying saucer" sound
            } else if (audioId.includes('c371')) {
                playMitsubishiIGBTSynth(); // Similar to C381
            } else if (audioId.includes('val256')) {
                playBJTChopperSynth();
            }
            
            // Start Visual Waveform animation
            animateWaveform();
        }
        
        function stopSound() {
            isPlaying = false;
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            
            const isKids = document.body.classList.contains('kids-mode');
            statusText.textContent = isKids ? `魔法運轉聲休息囉 (點擊播放運轉聲)` : `模擬運轉聲已停止 (點擊播放運轉聲)`;
            
            // Stop Web Audio nodes
            audioSources.forEach(src => {
                try { src.stop(); } catch(e) {}
            });
            audioSources = [];
            
            if (synthesisInterval) {
                clearInterval(synthesisInterval);
                synthesisInterval = null;
            }
            
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Reset to flatline
            setTimeout(() => {
                drawFlatWave(ctx, width, height);
            }, 100);
        }

        // --- Westinghouse GTO Synthesizer (C301) ---
        // Generates the legendary Taipei MRT C301 Westinghouse "flying saucer" (飛碟音) GTO sound
        function playWestinghouseGTOSynth() {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const masterVolume = audioCtx.createGain();
            masterVolume.gain.setValueAtTime(0, audioCtx.currentTime);
            masterVolume.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.3); // Fade in
            masterVolume.connect(audioCtx.destination);
            audioSources.push(masterVolume);
            
            // Oscillator for motor hum
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, audioCtx.currentTime); // Low growl
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(180, audioCtx.currentTime);
            
            osc.connect(filter);
            filter.connect(masterVolume);
            osc.start();
            audioSources.push(osc);

            // Modulator to make the buzzing spacey Westinghouse GTO sound
            const modulator = audioCtx.createOscillator();
            const modGain = audioCtx.createGain();
            modulator.frequency.value = 100; // 100Hz modulation
            modGain.gain.value = 35;
            
            modulator.connect(modGain);
            modGain.connect(osc.frequency);
            modulator.start();
            audioSources.push(modulator);

            // Flying saucer multi-stage GTO pitch steps
            const schedule = [
                { time: 1.2, oscFreq: 130, modFreq: 150, filterFreq: 280, volume: 0.12 },
                { time: 2.5, oscFreq: 180, modFreq: 220, filterFreq: 400, volume: 0.10 },
                { time: 3.8, oscFreq: 240, modFreq: 280, filterFreq: 550, volume: 0.08 },
                { time: 5.5, oscFreq: 330, modFreq: 350, filterFreq: 750, volume: 0.06 }
            ];

            schedule.forEach(step => {
                osc.frequency.setValueAtTime(step.oscFreq, audioCtx.currentTime + step.time);
                modulator.frequency.setValueAtTime(step.modFreq, audioCtx.currentTime + step.time);
                filter.frequency.setValueAtTime(step.filterFreq, audioCtx.currentTime + step.time);
                masterVolume.gain.setValueAtTime(step.volume, audioCtx.currentTime + step.time);
            });

            // Smooth sweep after steps
            const sweepTime = audioCtx.currentTime + 7.0;
            osc.frequency.setValueAtTime(330, sweepTime);
            osc.frequency.exponentialRampToValueAtTime(700, sweepTime + 3.5);
            filter.frequency.exponentialRampToValueAtTime(1000, sweepTime + 3.5);
            
            // Fade out when train goes far
            masterVolume.gain.setValueAtTime(0.06, sweepTime + 2.0);
            masterVolume.gain.linearRampToValueAtTime(0, sweepTime + 4.5);

            synthesisInterval = setTimeout(() => {
                if (isPlaying) stopSound();
            }, 12000);
        }

        // --- GTO Synthesizer (Siemens C321) ---
        // Generates the famous Siemens step-frequency singing sound
        function playSiemensGTOSynth() {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const masterVolume = audioCtx.createGain();
            masterVolume.gain.setValueAtTime(0, audioCtx.currentTime);
            masterVolume.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.3); // Fade in
            masterVolume.connect(audioCtx.destination);
            
            audioSources.push(masterVolume); // Save to list
            
            // Generate primary humming wave (Sawtooth)
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime); // Base rumbling
            
            filter.type = 'lowpass';
            filter.Q.setValueAtTime(8, audioCtx.currentTime);
            filter.frequency.setValueAtTime(220, audioCtx.currentTime);

            osc.connect(filter);
            filter.connect(masterVolume);
            
            osc.start();
            audioSources.push(osc);

            // Siemens GTO musical steps progression (acceleration sound)
            const timeline = [
                { time: 0.8, oscFreq: 147, filterFreq: 300 }, // F note (approx)
                { time: 1.6, oscFreq: 165, filterFreq: 350 }, // G note
                { time: 2.4, oscFreq: 196, filterFreq: 400 }, // A note
                { time: 3.2, oscFreq: 220, filterFreq: 450 }, // B note
                { time: 4.0, oscFreq: 262, filterFreq: 520 }, // C note
                { time: 4.8, oscFreq: 294, filterFreq: 600 }, // D note
                { time: 5.6, oscFreq: 330, filterFreq: 700 }  // E note
            ];
            
            timeline.forEach(step => {
                osc.frequency.setValueAtTime(step.oscFreq, audioCtx.currentTime + step.time);
                filter.frequency.setValueAtTime(step.filterFreq, audioCtx.currentTime + step.time);
            });
            
            // Post-steps: High-pitched smooth VVVF motor frequency transition
            const postStepsTime = audioCtx.currentTime + 6.2;
            osc.frequency.setValueAtTime(330, postStepsTime);
            osc.frequency.exponentialRampToValueAtTime(750, postStepsTime + 4.0);
            filter.frequency.exponentialRampToValueAtTime(1200, postStepsTime + 4.0);
            
            // Fade out when train goes far
            masterVolume.gain.setValueAtTime(0.12, postStepsTime + 3.0);
            masterVolume.gain.linearRampToValueAtTime(0, postStepsTime + 6.0);
            
            // Auto stop when finished
            synthesisInterval = setTimeout(() => {
                if (isPlaying) stopSound();
            }, 12500);
        }

        // --- IGBT Synthesizer (Mitsubishi C381 / C371) ---
        // Generates the modern smooth quiet high frequency hum of IGBT
        function playMitsubishiIGBTSynth() {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const masterVolume = audioCtx.createGain();
            masterVolume.gain.setValueAtTime(0, audioCtx.currentTime);
            masterVolume.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.4);
            masterVolume.connect(audioCtx.destination);
            audioSources.push(masterVolume);

            // IGBT starts at high frequency and sweeps smoothly down then fades into high speed roar
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(850, audioCtx.currentTime); // High pitch starts
            osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 2.0); // Sweep down
            osc.frequency.setValueAtTime(350, audioCtx.currentTime + 2.0);
            osc.frequency.linearRampToValueAtTime(450, audioCtx.currentTime + 7.0); // Slow rise with speed
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 2.5);
            
            osc.connect(filter);
            filter.connect(masterVolume);
            
            osc.start();
            audioSources.push(osc);

            // Add wind/track noise overlay (white noise simulation using BiquadFilter)
            const bufferSize = audioCtx.sampleRate * 4; // 4 seconds noise
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(150, audioCtx.currentTime);
            noiseFilter.Q.setValueAtTime(2, audioCtx.currentTime);
            
            const noiseVolume = audioCtx.createGain();
            noiseVolume.gain.setValueAtTime(0, audioCtx.currentTime);
            noiseVolume.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 2.0); // Gradual build-up
            
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseVolume);
            noiseVolume.connect(masterVolume);
            
            noise.start();
            audioSources.push(noise);
            audioSources.push(noiseVolume);

            // Fade out
            masterVolume.gain.setValueAtTime(0.1, audioCtx.currentTime + 6.0);
            masterVolume.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 9.0);
            
            synthesisInterval = setTimeout(() => {
                if (isPlaying) stopSound();
            }, 9500);
        }

        // --- BJT Chopper Synthesizer (VAL256 / early C301) ---
        // Generates constant electrical switching sound
        function playBJTChopperSynth() {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const masterVolume = audioCtx.createGain();
            masterVolume.gain.setValueAtTime(0, audioCtx.currentTime);
            masterVolume.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.2);
            masterVolume.connect(audioCtx.destination);
            audioSources.push(masterVolume);

            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, audioCtx.currentTime); // High BJT chopper frequency
            
            // Modulate the frequency slightly to simulate power grids
            const modulator = audioCtx.createOscillator();
            const modGain = audioCtx.createGain();
            modulator.frequency.value = 50; // 50Hz grid noise
            modGain.gain.value = 15;
            
            modulator.connect(modGain);
            modGain.connect(osc.frequency);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, audioCtx.currentTime);
            
            osc.connect(filter);
            filter.connect(masterVolume);
            
            modulator.start();
            osc.start();
            
            audioSources.push(modulator);
            audioSources.push(osc);
            
            // Fading out
            masterVolume.gain.setValueAtTime(0.08, audioCtx.currentTime + 5.0);
            masterVolume.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 7.5);
            
            synthesisInterval = setTimeout(() => {
                if (isPlaying) stopSound();
            }, 8000);
        }
        
        // --- Waveform Canvas Animator ---
        function animateWaveform() {
            if (!isPlaying) return;
            
            // Resize canvas on-the-fly to handle flex layouts
            if (canvas.width !== canvas.offsetWidth) {
                width = canvas.width = canvas.offsetWidth;
                height = canvas.height = canvas.offsetHeight;
            }
            
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-petrol').trim() || '#009999';
            
            const sliceWidth = width / 60;
            ctx.moveTo(0, height / 2);
            
            for (let i = 0; i <= 60; i++) {
                const x = i * sliceWidth;
                // Generate a cool dynamic frequency wave formula
                const timeFactor = Date.now() * 0.008;
                let amplitude = height * 0.35;
                
                // Let wave swell and shrink randomly
                const noise = Math.sin(timeFactor * 0.5) * 0.4 + 0.6;
                const y = (height / 2) + Math.sin(i * 0.15 + timeFactor) * Math.cos(i * 0.05 - timeFactor * 0.5) * amplitude * noise;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            animationFrameId = requestAnimationFrame(animateWaveform);
        }
    });
}

function drawFlatWave(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-border-dark').trim() || '#1b3846';
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}

/* ==========================================================================
   SCROLL INTERSECTION ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
    // Reveal transitions on scroll
    const sections = document.querySelectorAll('.train-section, .id-card');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const observerOptions = {
        root: null,
        threshold: 0.15,
        rootMargin: '-50px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Auto-highlight active navigation link
                const sectionId = entry.target.getAttribute('id');
                if (sectionId) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.classList.add('reveal-on-scroll');
        sectionObserver.observe(section);
    });
}
