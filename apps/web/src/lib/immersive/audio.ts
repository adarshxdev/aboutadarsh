'use client'

import { live } from './store'

/**
 * The home page soundtrack. Plays the uploaded music file when the profile has
 * one (`setMusic`); otherwise an ambient pad generated with Web Audio, so there
 * is nothing to download. Pad: detuned oscillators → slow lowpass → feedback delay.
 * An analyser feeds `live.level`, which the header bars and the particle pulse read.
 *
 * Browsers only allow audio after a user gesture, so `start()` must be called
 * from a click handler (the loader's "Enter with sound", or the sound toggle).
 */

const VOLUME = 0.16
/** A minor-ish open voicing; low enough to sit under speech. */
const NOTES = [110, 164.81, 220, 246.94, 329.63]

let ctx: AudioContext | null = null
let master: GainNode | null = null
let analyser: AnalyserNode | null = null
let raf = 0
let stopTimer = 0
let musicUrl: string | null = null
let musicEl: HTMLAudioElement | null = null

/** Call before the first `startAudio()`. */
export function setMusic(url: string | null | undefined) {
  musicUrl = url || null
}

function build() {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return false

  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = 0

  analyser = ctx.createAnalyser()
  analyser.fftSize = 64
  analyser.smoothingTimeConstant = 0.8
  master.connect(analyser)
  analyser.connect(ctx.destination)

  if (musicUrl) {
    musicEl = new Audio(musicUrl)
    musicEl.loop = true
    musicEl.crossOrigin = 'anonymous'
    ctx.createMediaElementSource(musicEl).connect(master)
    return true
  }

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  filter.Q.value = 0.7

  // Slow LFO on the filter cutoff, so the pad breathes.
  const lfo = ctx.createOscillator()
  const lfoDepth = ctx.createGain()
  lfo.frequency.value = 0.05
  lfoDepth.gain.value = 500
  lfo.connect(lfoDepth).connect(filter.frequency)
  lfo.start()

  const delay = ctx.createDelay(2)
  delay.delayTime.value = 0.6
  const feedback = ctx.createGain()
  feedback.gain.value = 0.35
  delay.connect(feedback).connect(delay)

  NOTES.forEach((freq, i) => {
    for (const detune of [-6, 6]) {
      const osc = ctx!.createOscillator()
      osc.type = i % 2 ? 'triangle' : 'sine'
      osc.frequency.value = freq
      osc.detune.value = detune
      const voice = ctx!.createGain()
      voice.gain.value = 0.08 / (i + 1)
      osc.connect(voice).connect(filter)
      osc.start()
    }
  })

  filter.connect(master)
  filter.connect(delay)
  delay.connect(master)
  return true
}

function meter() {
  if (!analyser) return
  const bins = new Uint8Array(analyser.frequencyBinCount)
  const tick = () => {
    analyser!.getByteFrequencyData(bins)
    let sum = 0
    for (const b of bins) sum += b
    live.level = sum / bins.length / 255
    raf = requestAnimationFrame(tick)
  }
  cancelAnimationFrame(raf)
  tick()
}

export async function startAudio() {
  if (!ctx && !build()) return false
  window.clearTimeout(stopTimer)
  await ctx!.resume()
  if (musicEl) await musicEl.play().catch(() => {})
  const now = ctx!.currentTime
  master!.gain.cancelScheduledValues(now)
  master!.gain.setTargetAtTime(VOLUME, now, 1.2)
  meter()
  return true
}

export function stopAudio() {
  if (!ctx || !master) return
  const now = ctx.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setTargetAtTime(0, now, 0.3)
  stopTimer = window.setTimeout(() => {
    cancelAnimationFrame(raf)
    live.level = 0
    musicEl?.pause()
    void ctx?.suspend()
  }, 1200)
}
