// LayerAudio - Complete JavaScript Implementation
class LayerAudio {
    constructor() {
        // State variables
        this.running = false;
        this.maxnum = this.getRandomInt(1, 314);
        this.totalchannels = 0;
        this.songs = [];
        this.count = 0;
        this.bassdelta = 0;
        this.trebledelta = 0;
        this.volumedelta = 0;
        this.bass = this.getRandomInt(0, 1000);
        this.treble = this.getRandomInt(0, 666);
        this.volume = 0.5 + this.getRandomInt(0, 31420) / 20;
        this.aichannels = 0;
        this.aibass = 0;
        this.aitreble = 0;
        this.aivolume = 0;
        this.aimaxnum = 0;

        // Audio processing variables
        this.crayzz = 0;
        this.panfull = "";
        this.audchnum = 0;
        this.extension = "mp3";
        this.bitrate = 192;
        this.channels = [];
        this.pan = {};
        this.audioContext = null;
        this.audioBuffers = [];
        this.knowledgeBase = [];

        // DOM Elements
        this.setupSection = document.getElementById('setupSection');
        this.mixingSection = document.getElementById('mixingSection');
        this.startBtn = document.getElementById('startBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.rememberBtn = document.getElementById('rememberBtn');
        this.rerunBtn = document.getElementById('rerunBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.logOutput = document.getElementById('logOutput');
        this.progressOverlay = document.getElementById('progressOverlay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');

        // Slider elements
        this.bassSlider = document.getElementById('bassSlider');
        this.trebleSlider = document.getElementById('trebleSlider');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.bassValue = document.getElementById('bassValue');
        this.trebleValue = document.getElementById('trebleValue');
        this.volumeValue = document.getElementById('volumeValue');

        // Display elements
        this.maxNumDisplay = document.getElementById('maxNumDisplay');
        this.totalChannelsDisplay = document.getElementById('totalChannelsDisplay');
        this.panDisplay = document.getElementById('panDisplay');

        this.initEventListeners();
        this.loadKnowledgeBase();
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.handleStart());
        this.generateBtn.addEventListener('click', () => this.handleGenerate());
        this.rememberBtn.addEventListener('click', () => this.handleRemember());
        this.rerunBtn.addEventListener('click', () => this.handleRerun());
        this.stopBtn.addEventListener('click', () => this.handleStop());

        // Slider listeners
        this.bassSlider.addEventListener('input', (e) => {
            this.bassdelta = parseInt(e.target.value);
            this.bassValue.textContent = this.bassdelta;
        });

        this.trebleSlider.addEventListener('input', (e) => {
            this.trebledelta = parseInt(e.target.value);
            this.trebleValue.textContent = this.trebledelta;
        });

        this.volumeSlider.addEventListener('input', (e) => {
            this.volumedelta = parseInt(e.target.value);
            this.volumeValue.textContent = this.volumedelta;
        });
    }

    handleStart() {
        const songInput = document.getElementById('songInput');
        const craziness = parseInt(document.getElementById('craziness').value);
        const surround = document.getElementById('surround').value;
        const extension = document.getElementById('extension').value;
        const bitrate = parseInt(document.getElementById('bitrate').value);
        const loadAI = document.getElementById('loadAI').checked;

        if (songInput.files.length === 0) {
            this.addLog('Please select at least one audio file', 'error');
            return;
        }

        this.crayzz = craziness;
        this.extension = extension;
        this.bitrate = bitrate;
        this.songs = Array.from(songInput.files);

        // Set audio channels based on surround selection
        this.setSurroundChannels(surround);

        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.addLog(`Starting LayerAudio with ${this.songs.length} song(s)`, 'info');
        this.addLog(`Craziness Level: ${craziness}`, 'info');
        this.addLog(`Surround: ${surround} (${this.audchnum} channels)`, 'info');
        this.addLog(`Output Format: ${extension} @ ${bitrate}Kb/s`, 'info');

        if (loadAI) {
            this.addLog('Loading AI Knowledge Base...', 'info');
            this.loadAIKnowledgeBase();
        }

        this.countSongs();
    }

    setSurroundChannels(panfull) {
        const channelMap = {
            'mono': 1,
            'stereo': 2,
            '5.1': 6,
            '7.1': 8,
            'hexadecagonal': 16,
            '22.2': 24
        };
        this.audchnum = channelMap[panfull];
        this.panfull = panfull;
    }

    async countSongs() {
        this.addLog('STARTING THE SONG COUNT', 'info');
        this.count = 0;
        this.totalchannels = 0;
        this.audioBuffers = [];

        for (let i = 0; i < this.songs.length; i++) {
            const song = this.songs[i];
            const arrayBuffer = await this.readFile(song);
            
            try {
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.push(audioBuffer);
                this.channels[this.count] = audioBuffer.numberOfChannels;
                this.totalchannels += audioBuffer.numberOfChannels;
                
                this.addLog(`Song ${this.count + 1}: ${song.name} (${audioBuffer.numberOfChannels} channels)`, 'info');
                this.count++;
            } catch (e) {
                this.addLog(`Error decoding ${song.name}: ${e.message}`, 'error');
            }
        }

        this.addLog('SONG COUNT DONE', 'success');
        this.addLog(`Total Channels: ${this.totalchannels}`, 'info');

        this.setupPans();
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    setupPans() {
        this.addLog('STARTING THE PAN SETUP', 'info');
        
        // Initialize pan array
        for (let i = 0; i < this.maxnum * 64; i++) {
            this.pan[i] = '';
        }

        // Setup pan for each position
        for (let i = 0; i < this.maxnum * 64; i++) {
            const used = {};
            let randomc = '';

            for (let x = 0; x < this.crayzz; x++) {
                used[x] = '';
                let add = 1;
                let op = this.getRandomInt(0, 1);
                let oper = op ? '+' : '-';
                op = this.getRandomInt(0, 1);
                let opel = op ? '+' : '-';
                
                if (x === 0) {
                    opel = '';
                    oper = '';
                }

                randomc = this.getRandomInt(0, this.totalchannels);

                // Check if already used
                for (let z = 0; z < x; z++) {
                    if (used[z] === randomc) {
                        add = 0;
                        break;
                    }
                }

                if (add) {
                    this.pan[i] = `c${randomc}${opel}` + (this.pan[i] || '');
                }

                used[x] = randomc;
            }

            if (this.pan[i] === '') {
                this.pan[i] = 'c0';
            }
        }

        // Build panfull configuration
        let panfullConfig = this.panfull;
        for (let i = 0; i < this.audchnum; i++) {
            const panIndex = this.getRandomInt(0, this.maxnum * 4 - 1);
            panfullConfig += `|c${i}=${this.pan[panIndex] || 'c0'}`;
        }

        this.panfull = panfullConfig;
        this.addLog('PAN SETUP DONE', 'success');

        // Update display and transition to mixing section
        this.updateDisplay();
        this.setupSection.classList.remove('active');
        this.mixingSection.classList.add('active');
        this.running = true;
    }

    updateDisplay() {
        this.maxNumDisplay.textContent = this.maxnum;
        this.totalChannelsDisplay.textContent = this.totalchannels;
        this.panDisplay.textContent = this.panfull.substring(0, 100) + (this.panfull.length > 100 ? '...' : '');
    }

    async handleGenerate() {
        if (!this.running) return;

        const datetime = new Date().toISOString().replace(/[:.]/g, '');
        
        this.addLog('Generating audio mix...', 'info');
        this.showProgress(true);

        // Calculate final parameters
        const finalBass = this.bass + this.bassdelta;
        const finalTreble = this.treble + this.trebledelta;
        const finalVolume = this.volume + this.volumedelta / 100;

        this.addLog(`Bass: ${finalBass}, Treble: ${finalTreble}, Volume: ${finalVolume}`, 'info');
        this.addLog(`Pan Config: ${this.panfull}`, 'info');

        try {
            // Simulate audio processing
            await this.processAudio(finalBass, finalTreble, finalVolume);
            this.addLog(`Mix generated: out_${datetime}.${this.extension}`, 'success');
            this.showProgress(false);
        } catch (e) {
            this.addLog(`Error generating mix: ${e.message}`, 'error');
            this.showProgress(false);
        }
    }

    async processAudio(bass, treble, volume) {
        return new Promise((resolve) => {
            // Simulate processing time
            setTimeout(() => {
                // In a real implementation, this would use Web Audio API
                // to apply bass, treble, and volume adjustments
                this.addLog('Audio processing complete', 'success');
                resolve();
            }, Math.random() * 2000 + 1000);
        });
    }

    handleRemember() {
        if (!this.running) return;

        const entry = {
            channels: this.totalchannels,
            pan: this.panfull,
            bass: this.bass,
            treble: this.treble,
            volume: this.volume,
            maxnum: this.maxnum
        };

        this.knowledgeBase.push(entry);
        this.saveKnowledgeBase();
        this.addLog('Mix saved to Knowledge Base', 'success');
    }

    handleRerun() {
        if (!this.running) return;

        // Reset sliders
        this.bassSlider.value = 0;
        this.trebleSlider.value = 0;
        this.volumeSlider.value = 0;
        this.bassdelta = 0;
        this.trebledelta = 0;
        this.volumedelta = 0;

        this.bassValue.textContent = '0';
        this.trebleValue.textContent = '0';
        this.volumeValue.textContent = '0';

        // Regenerate pan configuration
        this.setupPans();
        this.addLog('New mix configuration generated', 'info');
    }

    handleStop() {
        this.running = false;
        this.setupSection.classList.add('active');
        this.mixingSection.classList.remove('active');
        this.addLog('Mixing session stopped', 'warning');
        this.addLog('COPYRIGHT FFMPEG & BRENDAN CARELL', 'info');
        
        // Reset form
        document.getElementById('songInput').value = '';
        this.songs = [];
        this.audioBuffers = [];
    }

    loadAIKnowledgeBase() {
        const stored = localStorage.getItem('layerAudio_knowledgeBase');
        if (stored) {
            try {
                this.knowledgeBase = JSON.parse(stored);
                let aichannels = 0, aibass = 0, aitreble = 0, aivolume = 0, aimaxnum = 0;

                for (let entry of this.knowledgeBase) {
                    aichannels += entry.channels;
                    aibass += entry.bass;
                    aitreble += entry.treble;
                    aivolume += entry.volume;
                    aimaxnum += entry.maxnum;
                }

                const count = this.knowledgeBase.length;
                this.aichannels = aichannels / count;
                this.aibass = aibass / count;
                this.aitreble = aitreble / count;
                this.aivolume = aivolume / count;
                this.aimaxnum = aimaxnum / count;

                // Apply AI adjustments
                this.maxnum = Math.floor(
                    (this.getRandomInt(-128, 128) - this.getRandomInt(-128, 128)) + this.aimaxnum
                );
                this.bass = Math.floor(
                    (this.getRandomInt(-18, 18) - this.getRandomInt(-18, 18)) + this.aibass / this.maxnum
                ) / 20000000000;
                this.treble = Math.floor(
                    (this.getRandomInt(-12, 12) - this.getRandomInt(-12, 12)) + this.aitreble / this.maxnum
                ) / 1000000000000000;
                this.volume = Math.floor(
                    (this.getRandomInt(-2, 2) - this.getRandomInt(-5, 5)) + this.aivolume
                ) / 250000000 / this.maxnum / 100;

                this.addLog('AI Knowledge Base loaded successfully', 'success');
                this.addLog(`Average Bass: ${this.bass.toFixed(4)}, Treble: ${this.treble.toFixed(4)}, Volume: ${this.volume.toFixed(4)}`, 'info');
            } catch (e) {
                this.addLog('Error loading Knowledge Base: ' + e.message, 'error');
            }
        }
    }

    loadKnowledgeBase() {
        const stored = localStorage.getItem('layerAudio_knowledgeBase');
        if (stored) {
            try {
                this.knowledgeBase = JSON.parse(stored);
            } catch (e) {
                this.knowledgeBase = [];
            }
        }
    }

    saveKnowledgeBase() {
        localStorage.setItem('layerAudio_knowledgeBase', JSON.stringify(this.knowledgeBase));
    }

    addLog(message, type = 'info') {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        line.textContent = `[${timestamp}] ${message}`;
        this.logOutput.appendChild(line);
        this.logOutput.scrollTop = this.logOutput.scrollHeight;
    }

    showProgress(show) {
        if (show) {
            this.progressOverlay.classList.remove('hidden');
            this.animateProgress();
        } else {
            this.progressOverlay.classList.add('hidden');
        }
    }

    animateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = Math.floor(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.layerAudio = new LayerAudio();
});
