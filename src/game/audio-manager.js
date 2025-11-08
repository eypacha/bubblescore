import { Howl } from 'howler'

export class AudioManager {
  constructor() {
    this.popSounds = []
    this.dropSounds = []
    this.initialize()
  }

  initialize() {
    // Configurar sonidos de fusión
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
    
    // Sonidos para primera colisión
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
    // Seleccionar aleatoriamente entre pop1.mp3 y pop2.mp3
    const randomIndex = Math.floor(Math.random() * this.popSounds.length)
    const selectedSound = this.popSounds[randomIndex]
    
    // Reproducir el sonido
    selectedSound.play()
    
    console.log(`Reproduciendo sonido: pop${randomIndex + 1}.mp3`)
  }

  playDropSound() {
    // Seleccionar aleatoriamente entre drop1.mp3 y drop2.mp3
    const randomIndex = Math.floor(Math.random() * this.dropSounds.length)
    const selectedSound = this.dropSounds[randomIndex]
    
    // Reproducir el sonido
    selectedSound.play()
    
    console.log(`Reproduciendo sonido: drop${randomIndex + 1}.mp3`)
  }

  destroy() {
    // Limpiar recursos de audio
    this.popSounds.forEach(sound => sound.unload())
    this.dropSounds.forEach(sound => sound.unload())
    this.popSounds = []
    this.dropSounds = []
  }
}