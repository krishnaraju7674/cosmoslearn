import * as Tone from 'tone';

class AudioEngine {
  private _initialized = false;
  private _ambientSynth: Tone.FMSynth | null = null;
  private _ambientFilter: Tone.Filter | null = null;
  private _ambientReverb: Tone.Reverb | null = null;
  private _masterVolume: Tone.Volume | null = null;
  private _ambientInterval: ReturnType<typeof setInterval> | null = null;

  async init(): Promise<void> {
    if (this._initialized) return;

    await Tone.start();

    this._masterVolume = new Tone.Volume(0).toDestination();
    this._initialized = true;
  }

  async playAmbient(): Promise<void> {
    if (!this._initialized) await this.init();

    // Stop any existing ambient before starting a new one
    this.stopAmbient();

    this._ambientFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 400,
      rolloff: -24,
    });

    this._ambientReverb = new Tone.Reverb({
      decay: 12,
      wet: 0.85,
    });

    this._ambientSynth = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: {
        attack: 4,
        decay: 1,
        sustain: 1,
        release: 6,
      },
      volume: -20,
    });

    this._ambientSynth.chain(
      this._ambientFilter,
      this._ambientReverb,
      this._masterVolume!
    );

    // Play a sustained low chord: C1, G1, C2
    // We use a PolySynth-like approach by triggering a low note and relying on harmonics
    // For a true chord, schedule multiple notes offset slightly
    const now = Tone.now();
    this._ambientSynth.triggerAttack('C1', now);

    // Create additional synth voices for the chord
    const voice2 = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: { attack: 5, decay: 1, sustain: 1, release: 6 },
      volume: -24,
    }).chain(this._ambientFilter!, this._ambientReverb!, this._masterVolume!);

    const voice3 = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: { attack: 6, decay: 1, sustain: 1, release: 6 },
      volume: -22,
    }).chain(this._ambientFilter!, this._ambientReverb!, this._masterVolume!);

    voice2.triggerAttack('G1', now + 0.5);
    voice3.triggerAttack('C2', now + 1);

    // Store extra voices for cleanup
    (this as any)._ambientVoices = [voice2, voice3];

    // Schedule random ambient soundscape events
    this._scheduleAmbientSounds();
  }

  stopAmbient(): void {
    // Clear random sound interval
    if (this._ambientInterval) {
      clearInterval(this._ambientInterval);
      this._ambientInterval = null;
    }

    if (this._ambientSynth) {
      try {
        this._ambientSynth.triggerRelease();
      } catch {
        // ignore if already released
      }
      this._ambientSynth.dispose();
      this._ambientSynth = null;
    }

    // Clean up extra voices
    const voices = (this as any)._ambientVoices as Tone.FMSynth[] | undefined;
    if (voices) {
      voices.forEach((v) => {
        try {
          v.triggerRelease();
        } catch {
          // ignore
        }
        v.dispose();
      });
      (this as any)._ambientVoices = null;
    }

    if (this._ambientFilter) {
      this._ambientFilter.dispose();
      this._ambientFilter = null;
    }
    if (this._ambientReverb) {
      this._ambientReverb.dispose();
      this._ambientReverb = null;
    }
  }

  async playPlanetSelect(planetIndex: number): Promise<void> {
    if (!this._initialized) await this.init();

    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 },
      volume: -12,
    }).connect(this._masterVolume!);

    // Pitch varies by planet index: C4 + semitones
    const baseNote = Tone.Frequency('C4').toMidi() + planetIndex;
    const freq = Tone.Frequency(baseNote, 'midi').toFrequency();

    const now = Tone.now();
    synth.triggerAttackRelease(freq, '8n', now);

    // Play a second chime note slightly higher for an ascending feel
    const synth2 = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.4 },
      volume: -14,
    }).connect(this._masterVolume!);

    synth2.triggerAttackRelease(
      Tone.Frequency(baseNote + 7, 'midi').toFrequency(),
      '16n',
      now + 0.1
    );

    // Auto-dispose after playing
    setTimeout(() => {
      synth.dispose();
      synth2.dispose();
    }, 2000);
  }

  async playCorrect(): Promise<void> {
    if (!this._initialized) await this.init();

    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.3 },
      volume: -10,
    }).connect(this._masterVolume!);

    const notes = ['C5', 'E5', 'G5', 'C6'];
    const now = Tone.now();

    notes.forEach((note, i) => {
      synth.triggerAttackRelease(note, '16n', now + i * 0.1);
    });

    setTimeout(() => synth.dispose(), 2000);
  }

  async playWrong(): Promise<void> {
    if (!this._initialized) await this.init();

    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.5 },
      volume: -14,
    }).connect(this._masterVolume!);

    const now = Tone.now();
    synth.triggerAttackRelease('C3', '8n', now);
    synth.triggerAttackRelease('G2', '8n', now + 0.2);

    setTimeout(() => synth.dispose(), 2000);
  }

  async playClick(): Promise<void> {
    if (!this._initialized) await this.init();

    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      volume: -20,
    }).connect(this._masterVolume!);

    synth.triggerAttackRelease('C4', '32n');

    setTimeout(() => synth.dispose(), 500);
  }

  async playLaunchWhoosh(): Promise<void> {
    if (!this._initialized) await this.init();

    // Dramatic sweep
    const noise = new Tone.Noise('pink').start();
    const filter = new Tone.Filter({
      type: 'bandpass',
      frequency: 100,
      Q: 2,
    });
    const env = new Tone.AmplitudeEnvelope({
      attack: 0.1,
      decay: 0.8,
      sustain: 0,
      release: 0.5,
    });

    noise.chain(filter, env, this._masterVolume!);
    
    // Sweep the filter frequency upwards
    const now = Tone.now();
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
    env.triggerAttackRelease(0.8, now);

    // Deep sub-bass boom
    const subOsc = new Tone.Oscillator('sine').connect(this._masterVolume!);
    const subEnv = new Tone.AmplitudeEnvelope({
      attack: 0.05,
      decay: 1.5,
      sustain: 0,
      release: 0.5,
    });
    subOsc.connect(subEnv);
    subOsc.frequency.setValueAtTime(80, now + 0.5);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 1.8);
    subOsc.start(now + 0.5);
    subEnv.triggerAttackRelease(1.5, now + 0.5);

    setTimeout(() => {
      noise.dispose();
      filter.dispose();
      env.dispose();
      subOsc.dispose();
      subEnv.dispose();
    }, 3000);
  }

  setVolume(volume: number): void {
    if (!this._masterVolume) return;
    // Map 0-1 to -60dB to 0dB
    const db = volume <= 0 ? -Infinity : -60 + volume * 60;
    this._masterVolume.volume.value = db;
  }

  setMuted(muted: boolean): void {
    if (!this._masterVolume) return;
    this._masterVolume.mute = muted;
  }

  private _scheduleAmbientSounds(): void {
    this._ambientInterval = setInterval(() => {
      this._playRandomSpaceSound();
    }, 8000 + Math.random() * 12000);
  }

  private async _playRandomSpaceSound(): Promise<void> {
    const sounds = ['ping', 'drone', 'chime', 'noise'] as const;
    const type = sounds[Math.floor(Math.random() * sounds.length)];

    switch (type) {
      case 'ping':
        this._playSpacePing();
        break;
      case 'drone':
        this._playDroneShift();
        break;
      case 'chime':
        this._playSpaceChime();
        break;
      case 'noise':
        this._playNoiseBurst();
        break;
    }
  }

  private async _playSpacePing(): Promise<void> {
    if (!this._masterVolume) return;
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.3, decay: 0.8, sustain: 0, release: 0.5 },
      volume: -30,
    }).connect(this._masterVolume);

    const notes = ['G4', 'C5', 'E5', 'G5'];
    const now = Tone.now();
    const note = notes[Math.floor(Math.random() * notes.length)];
    synth.triggerAttackRelease(note, '2n', now);
    setTimeout(() => synth.dispose(), 3000);
  }

  private async _playDroneShift(): Promise<void> {
    if (!this._masterVolume) return;
    const osc = new Tone.Oscillator({
      type: 'sine',
      frequency: 55 + Math.random() * 40,
    });
    const env = new Tone.AmplitudeEnvelope({
      attack: 2,
      decay: 3,
      sustain: 0,
      release: 4,
    });
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 200,
      Q: 5,
    });
    osc.chain(filter, env, this._masterVolume);
    env.triggerAttackRelease(6, Tone.now());
    osc.start();

    const now = Tone.now();
    osc.frequency.setValueAtTime(55 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(
      30 + Math.random() * 20,
      now + 5
    );

    setTimeout(() => {
      osc.stop();
      osc.dispose();
      env.dispose();
      filter.dispose();
    }, 8000);
  }

  private async _playSpaceChime(): Promise<void> {
    if (!this._masterVolume) return;
    const synth = new Tone.FMSynth({
      harmonicity: 2.5 + Math.random(),
      modulationIndex: 1,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: { attack: 0.5, decay: 1, sustain: 0, release: 3 },
      volume: -28,
    }).connect(this._masterVolume!);

    const now = Tone.now();
    const note = Tone.Frequency(220 + Math.random() * 440).toNote();
    synth.triggerAttackRelease(note, '4n', now);

    setTimeout(() => synth.dispose(), 5000);
  }

  private async _playNoiseBurst(): Promise<void> {
    if (!this._masterVolume) return;
    const noise = new Tone.Noise('brown').start();
    const env = new Tone.AmplitudeEnvelope({
      attack: 0.5,
      decay: 0.5,
      sustain: 0.1,
      release: 1,
    });
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 100,
    });
    noise.chain(filter, env, this._masterVolume);
    env.triggerAttackRelease(2, Tone.now());

    setTimeout(() => {
      noise.stop();
      noise.dispose();
      env.dispose();
      filter.dispose();
    }, 3000);
  }
}

export const audioEngine = new AudioEngine();
