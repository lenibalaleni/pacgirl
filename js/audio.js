class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmOscillators = [];
    this.bgmPlaying = false;
    this.currentBgmLevel = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.15;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startBGM(intensity = 0) {
    if (!this.initialized || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this._createDrone(intensity);
  }

  _createDrone(intensity) {
    if (!this.initialized) return;

    this.stopBGM();

    const baseFreq = 55 + intensity * 10;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = baseFreq;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = baseFreq * 1.5;

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.value = baseFreq * 0.5;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3 + intensity * 0.2;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 10 + intensity * 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200 + intensity * 100;
    filter.Q.value = 5;

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 100 + intensity * 50;

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.6;

    osc1.connect(filter);
    osc2.connect(filter2);
    filter.connect(subGain);
    filter2.connect(subGain);
    osc3.connect(subGain);

    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.3 + intensity * 0.1;
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = 0.2;
    subGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(subGain);

    subGain.connect(this.bgmGain);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    this.bgmOscillators = [osc1, osc2, osc3, lfo];
    this.bgmNodes = [filter, filter2, subGain, lfoGain, delay, delayGain];
  }

  stopBGM() {
    for (const osc of this.bgmOscillators) {
      try { osc.stop(); } catch (e) {}
    }
    this.bgmOscillators = [];
    this.bgmNodes = [];
    this.bgmPlaying = false;
  }

  updateBGMIntensity(intensity) {
    if (Math.floor(intensity) !== this.currentBgmLevel) {
      this.currentBgmLevel = Math.floor(intensity);
      if (this.bgmPlaying) {
        this._createDrone(this.currentBgmLevel);
      }
    }
  }

  playDotCollect() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playBigDotCollect() {
    if (!this.initialized) return;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440 + i * 220, this.ctx.currentTime + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(880 + i * 220, this.ctx.currentTime + i * 0.08 + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.15);
    }
  }

  playPowerup() {
    if (!this.initialized) return;
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + i * 0.1);
      osc.stop(this.ctx.currentTime + i * 0.1 + 0.2);
    }
  }

  playDeath() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);

    const noise = this._createNoise(0.5);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
  }

  playEnemyDeath() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playLevelComplete() {
    if (!this.initialized) return;
    const notes = [523, 659, 784, 880, 1047];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + i * 0.12);
      osc.stop(this.ctx.currentTime + i * 0.12 + 0.25);
    }
  }

  playHeartbeat(proximity) {
    if (!this.initialized || proximity <= 0) return;
    const vol = Math.min(0.15, proximity * 0.1);
    const freq = 60 + proximity * 20;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);

    setTimeout(() => {
      if (!this.initialized) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.5;
      gain2.gain.setValueAtTime(vol * 0.6, this.ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.1);
    }, 150);
  }

  playGlitch() {
    if (!this.initialized) return;
    const noise = this._createNoise(0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 10;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
  }

  playFootstep() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 100 + Math.random() * 40;
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  _createNoise(duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.start();
    source.stop(this.ctx.currentTime + duration);
    return source;
  }

  setMasterVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }
}