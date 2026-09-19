'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useXPSounds() {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('camisavetor_xp_muted');
      if (saved !== null) {
        setIsMuted(saved === 'true');
      }
    } catch {
      // Ignora erro de storage
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('camisavetor_xp_muted', String(next));
      } catch {
        // Ignora
      }
      return next;
    });
  }, []);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Bipe curto de clique de navegação (Windows Explorer)
  const playClick = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio error fallback silencioso
    }
  }, [isMuted, getAudioContext]);

  // Som de notificação / balão do XP (duas notas ascendentes brilhantes)
  const playNotify = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, time: now, dur: 0.12 },        // E5
        { freq: 880.00, time: now + 0.09, dur: 0.22 }, // A5
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + dur);
      });
    } catch {
      // Ignora
    }
  }, [isMuted, getAudioContext]);

  // Acorde clássico de erro/exclamação (chord.wav)
  const playError = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [349.23, 440.0, 523.25]; // F4, A4, C5
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch {
      // Ignora
    }
  }, [isMuted, getAudioContext]);

  // Acorde icônico de Inicialização do Windows XP sintetizado
  const playStartup = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Progressão harmônica clássica do XP: Eb -> Bb -> Ab -> Eb com harmônicos quentes
      const chords = [
        { freqs: [155.56, 311.13, 466.16], start: now, dur: 0.7 },        // Eb3, Eb4, Bb4
        { freqs: [233.08, 349.23, 587.33], start: now + 0.45, dur: 0.8 }, // Bb3, F4, D5
        { freqs: [207.65, 415.30, 622.25], start: now + 0.95, dur: 0.9 }, // Ab3, Ab4, Eb5
        { freqs: [311.13, 466.16, 622.25, 932.33], start: now + 1.5, dur: 1.8 } // Eb4, Bb4, Eb5, Bb5 (sustentação brilhante)
      ];

      chords.forEach(chord => {
        chord.freqs.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, chord.start);

          gain.gain.setValueAtTime(0.001, chord.start);
          gain.gain.linearRampToValueAtTime(0.07, chord.start + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, chord.start + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(chord.start);
          osc.stop(chord.start + chord.dur);
        });
      });
    } catch {
      // Ignora
    }
  }, [isMuted, getAudioContext]);

  // Som de encerramento / desligamento do Windows XP
  const playShutdown = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 392.00, start: now, dur: 0.4 },
        { freq: 311.13, start: now + 0.3, dur: 0.45 },
        { freq: 233.08, start: now + 0.65, dur: 0.5 },
        { freq: 155.56, start: now + 1.0, dur: 1.2 }
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Ignora
    }
  }, [isMuted, getAudioContext]);

  return {
    isMuted,
    toggleMute,
    playClick,
    playNotify,
    playError,
    playStartup,
    playShutdown,
  };
}
