import { Howl } from 'howler'

export class AudioManager {
  constructor() {
    this.popSounds = []
    this.dropSounds = []
    this.initialize()
  }

  initialize() {
    this.popSounds = [
      new Howl({
        src: ['/sounds/pop1.mp3'],
        volume: 0.5,
        preload: true
      }),
      new Howl({
        src: ['/sounds/pop2.mp3'], 
        volume: 0.5,
        preload: true
      })
    ]
    
    this.dropSounds = [
      new Howl({
        src: ['/sounds/drop1.mp3'],
        volume: 0.4,
        preload: true
      }),
      new Howl({
        src: ['/sounds/drop2.mp3'],
        volume: 0.4,
        preload: true
      })
    ]
  }

  playFusionSound() {
    const randomIndex = Math.floor(Math.random() * this.popSounds.length)
    const selectedSound = this.popSounds[randomIndex]
    selectedSound.play()
  }

  playDropSound() {
    const randomIndex = Math.floor(Math.random() * this.dropSounds.length)
    const selectedSound = this.dropSounds[randomIndex]
    selectedSound.play()
  }

  destroy() {
    this.popSounds.forEach(sound => sound.unload())
    this.dropSounds.forEach(sound => sound.unload())
    this.popSounds = []
    this.dropSounds = []
  }
}