// LayerAudio - Complete JavaScript Implementation
class LayerAudio {
    constructor() {
        // State variables
        this.running = false;
        this.maxnum = this.getRandomInt(1, 420);
        this.totalchannels = 0;
        this.songs = [];
        this.count = 0;
        this.bassdelta = 0;
        this.trebledelta = 0;
        this.volumedelta = 0;
        this.bass = this.getRandomInt(0, 420);
        this.treble = this.getRandomInt(0, 314);
        this.volume = 0.5 + this.getRandomInt(0, 31420) / 15;
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
        this.bitrate = 320;
        this.channels = [];
        this.pan = {};
        this.audioContext = null;
        this.audioBuffers = [];
        this.knowledgeBase = [];
        this.mixBlob = null;
        this.mixMimeType = 'audio/wav';

        // DOM Elements
        this.setupSection = document.getElementById('setupSection');
        this.mixingSection = document.getElementById('mixingSection');
        this.startBtn = document.getElementById('startBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.rememberBtn = document.getElementById('rememberBtn');
        this.rerunBtn = document.getElementById('rerunBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.logOutput = document.getElementById('logOutput');
        this.progressOverlay = document.getElementById('progressOverlay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.extensionSelect = document.getElementById('extension');

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
        this.updateOutputFormatOptions();
        this.loadKnowledgeBase();
        this.resetDownload();
        this.ffmpeg = null;
        this.fetchFile = null;
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.handleStart());
        this.generateBtn.addEventListener('click', () => this.handleGenerate());
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        this.rememberBtn.addEventListener('click', () => this.handleRemember());
        if (this.rerunBtn) {
            this.rerunBtn.addEventListener('click', () => this.handleRerun());
        }
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
        this.resetDownload();
        const songInput = document.getElementById('songInput');
        const craziness = parseInt(document.getElementById('craziness').value);
        const surround = document.getElementById('surround').value;
        const extension = this.extensionSelect.value;
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
        this.ensureSupportedExtension();

        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.addLog(`Starting LayerAudio with ${this.songs.length} song(s)`, 'info');
        this.addLog(`Craziness Level: ${craziness}`, 'info');
        this.addLog(`Surround: ${surround} (${this.audchnum} channels)`, 'info');
        this.addLog(`Output Format: ${this.extension} @ ${bitrate}Kb/s`, 'info');

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

    updateOutputFormatOptions() {
        this.outputFormatSupport = this.getOutputFormatSupport();
        const options = Array.from(this.extensionSelect.options);
        for (const option of options) {
            const originalLabel = option.dataset.label || option.textContent;
            option.dataset.label = originalLabel;
            const supported = !!this.outputFormatSupport[option.value];
            option.disabled = !supported;
            option.textContent = supported ? originalLabel : `${originalLabel} (browser export unavailable)`;
        }
        if (this.extensionSelect.selectedOptions.length) {
            const selected = this.extensionSelect.selectedOptions[0];
            if (selected.disabled) {
                this.extensionSelect.value = 'wav';
            }
        }
    }

    getOutputFormatSupport() {
        return {
            wav: true,
            mp3: true,
            opus: true,
            flac: true,
            wv: true
        };
    }

    ensureSupportedExtension() {
        const selected = this.extensionSelect.value;
        if (!this.outputFormatSupport || !this.outputFormatSupport[selected]) {
            this.addLog('Selected output format is not available in-browser. Falling back to WAV.', 'warning');
            this.extensionSelect.value = 'wav';
            this.extension = 'wav';
        }
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

        this.resetDownload();
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
            const { blob, extension } = await this.processAudio(finalBass, finalTreble, finalVolume);
            const filename = `out_${datetime}.${extension}`;
            this.addLog(`Mix generated: ${filename}`, 'success');
            this.setDownloadReady(filename, blob);
            this.showProgress(false);
        } catch (e) {
            this.addLog(`Error generating mix: ${e.message}`, 'error');
            this.showProgress(false);
        }
    }

    async processAudio(bass, treble, volume) {
        if (!this.audioBuffers.length) {
            throw new Error('No audio buffers available to mix');
        }

        // Simulate processing time for UI feedback
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 400));

        const { channelPool, maxLength, sampleRate } = this.buildChannelPool(this.audioBuffers);
        const outputChannels = Math.max(1, this.audchnum || channelPool.length || 1);
        const panMapping = this.parsePanMapping(this.panfull, outputChannels, channelPool.length);
        let mixBuffer = this.applyPanMapping(channelPool, panMapping, outputChannels, maxLength, sampleRate);
        this.normalizeBuffer(mixBuffer);
        mixBuffer = await this.applyToneShaping(mixBuffer, bass, treble);
        this.addLog(`Output Channels: ${mixBuffer.numberOfChannels}`, 'info');

        const volumeScale = Math.max(0, volume / 100);
        if (volumeScale !== 1) {
            this.applyGain(mixBuffer, volumeScale);
        }

        const { blob, extension, mimeType } = await this.encodeMix(mixBuffer);
        this.mixMimeType = mimeType;
        this.addLog('Audio processing complete', 'success');
        return { blob, extension };
    }

    buildChannelPool(buffers) {
        const maxLength = Math.max(...buffers.map((buffer) => buffer.length));
        const sampleRate = this.audioContext.sampleRate;
        const channelPool = [];

        for (const source of buffers) {
            for (let channel = 0; channel < source.numberOfChannels; channel++) {
                const sourceData = source.getChannelData(channel);
                const data = new Float32Array(maxLength);
                data.set(sourceData.subarray(0, maxLength));
                channelPool.push(data);
            }
        }

        return { channelPool, maxLength, sampleRate };
    }

    parsePanMapping(panfull, outputChannels, inputChannels) {
        const mapping = Array.from({ length: outputChannels }, () => [{ index: 0, gain: 1 }]);
        if (!panfull) return mapping;

        const segments = panfull.split('|').slice(1);
        for (const segment of segments) {
            const [left, right] = segment.split('=');
            if (!left || !right) continue;
            const outMatch = left.match(/c(\d+)/);
            if (!outMatch) continue;
            const outIndex = parseInt(outMatch[1], 10);
            if (Number.isNaN(outIndex) || outIndex < 0 || outIndex >= outputChannels) continue;

            const tokens = right.match(/[+-]?c\d+/g) || [];
            if (!tokens.length) continue;
            const entries = [];
            for (const token of tokens) {
                const sign = token.startsWith('-') ? -1 : 1;
                const index = parseInt(token.replace(/[+-]?c/, ''), 10);
                if (Number.isNaN(index) || index < 0 || index >= inputChannels) continue;
                entries.push({ index, gain: sign });
            }
            if (entries.length) {
                mapping[outIndex] = entries;
            }
        }

        return mapping;
    }

    applyPanMapping(channelPool, mapping, outputChannels, maxLength, sampleRate) {
        const output = this.audioContext.createBuffer(outputChannels, maxLength, sampleRate);
        for (let outChannel = 0; outChannel < outputChannels; outChannel++) {
            const outputData = output.getChannelData(outChannel);
            const entries = mapping[outChannel] || [];
            for (const entry of entries) {
                const inputData = channelPool[entry.index];
                if (!inputData) continue;
                const gain = entry.gain || 1;
                for (let i = 0; i < maxLength; i++) {
                    outputData[i] += inputData[i] * gain;
                }
            }
        }
        return output;
    }

    async applyToneShaping(buffer, bass, treble) {
        const bassGain = this.normalizeFilterGain(bass);
        const trebleGain = this.normalizeFilterGain(treble);
        if (bassGain === 0 && trebleGain === 0) {
            return buffer;
        }

        if (typeof OfflineAudioContext === 'undefined') {
            return buffer;
        }

        const offline = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
        const source = offline.createBufferSource();
        source.buffer = buffer;

        const bassFilter = offline.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 200;
        bassFilter.gain.value = bassGain;

        const trebleFilter = offline.createBiquadFilter();
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.value = 3000;
        trebleFilter.gain.value = trebleGain;

        source.connect(bassFilter).connect(trebleFilter).connect(offline.destination);
        source.start(0);
        return await offline.startRendering();
    }

    normalizeFilterGain(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return 0;
        const scaled = value / 10;
        return Math.max(-24, Math.min(24, scaled));
    }

    normalizeBuffer(buffer) {
        let peak = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                const value = Math.abs(data[i]);
                if (value > peak) peak = value;
            }
        }

        if (peak <= 1) return;

        const scale = 1 / peak;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] *= scale;
            }
        }
    }

    applyGain(buffer, gain) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] *= gain;
            }
        }
    }

    async encodeMix(buffer) {
        const wavBlob = this.audioBufferToWav(buffer);
        if (this.extension === 'wav') {
            return { blob: wavBlob, extension: 'wav', mimeType: 'audio/wav' };
        }

        try {
            const ffmpeg = await this.loadFfmpeg();
            const inputName = 'input.wav';
            const outputName = `output.${this.extension}`;
            ffmpeg.FS('writeFile', inputName, await this.fetchFile(wavBlob));

            const bitrate = this.getExportBitrate();
            const args = this.buildFfmpegArgs(inputName, outputName, this.extension, bitrate);
            await ffmpeg.run(...args);

            const data = ffmpeg.FS('readFile', outputName);
            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);
            const mimeType = this.getMimeType(this.extension);
            const blob = new Blob([data.buffer], { type: mimeType });
            return { blob, extension: this.extension, mimeType };
        } catch (error) {
            this.addLog(`Encoding to ${this.extension} failed. Falling back to WAV. (${error.message})`, 'warning');
            return { blob: wavBlob, extension: 'wav', mimeType: 'audio/wav' };
        }
    }

    async loadFfmpeg() {
        if (this.ffmpeg) return this.ffmpeg;
        this.addLog('Loading export encoder (first run only)...', 'info');

        const module = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
        const { createFFmpeg, fetchFile } = module;
        const ffmpeg = createFFmpeg({
            log: false,
            corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js'
        });

        await ffmpeg.load();
        this.ffmpeg = ffmpeg;
        this.fetchFile = fetchFile;
        return ffmpeg;
    }

    buildFfmpegArgs(inputName, outputName, extension, bitrate) {
        switch (extension) {
            case 'mp3':
                return ['-i', inputName, '-codec:a', 'libmp3lame', '-b:a', `${bitrate}k`, outputName];
            case 'opus':
                return ['-i', inputName, '-c:a', 'libopus', '-b:a', `${bitrate}k`, '-vbr', 'on', outputName];
            case 'flac':
                return ['-i', inputName, '-c:a', 'flac', '-compression_level', '5', outputName];
            case 'wv':
                return ['-i', inputName, '-c:a', 'wavpack', outputName];
            default:
                return ['-i', inputName, outputName];
        }
    }

    getExportBitrate() {
        const bitrate = Number.parseInt(this.bitrate, 10);
        if (!Number.isFinite(bitrate)) return 192;
        return Math.min(Math.max(bitrate, 32), 512);
    }

    audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const numFrames = buffer.length;
        const bytesPerSample = 2;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = numFrames * blockAlign;
        const bufferSize = 44 + dataSize;
        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);

        const writeString = (offset, text) => {
            for (let i = 0; i < text.length; i++) {
                view.setUint8(offset + i, text.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bytesPerSample * 8, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < numFrames; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = buffer.getChannelData(channel)[i];
                const clamped = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
                offset += bytesPerSample;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
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

        this.resetDownload();
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
        this.resetDownload();
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

    getMimeType(extension) {
        const map = {
            mp3: 'audio/mpeg',
            opus: 'audio/opus',
            flac: 'audio/flac',
            wv: 'audio/wavpack',
            wav: 'audio/wav'
        };
        return map[extension] || 'application/octet-stream';
    }

    resetDownload() {
        this.mixReady = false;
        this.mixFilename = '';
        this.mixBlob = null;
        this.downloadBtn.classList.add('hidden');
        this.downloadBtn.setAttribute('aria-disabled', 'true');
    }

    setDownloadReady(filename, blob) {
        if (!blob || blob.size === 0) {
            this.addLog('Mix generation failed: output was empty', 'error');
            this.resetDownload();
            return;
        }
        this.mixReady = true;
        this.mixFilename = filename;
        this.mixBlob = blob;
        this.downloadBtn.classList.remove('hidden');
        this.downloadBtn.removeAttribute('aria-disabled');
    }

    handleDownload() {
        if (!this.mixReady || !this.mixBlob) {
            this.addLog('No generated mix available for download', 'error');
            return;
        }
        const url = URL.createObjectURL(this.mixBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.mixFilename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.layerAudio = new LayerAudio();
});
