import { Howl } from 'howler'

export class AudioManager {
  constructor() {
    this.popSounds = [];
    this.dropSounds = [];
    this.tickingSound = null;
    this.bombSound = null;
    this.initialize();
  }

  playTickingSound() {
    this.tickingSound.play();
  }

  playBombSound() {
    this.bombSound.play();
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
    ];

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
    ];

    this.tickingSound = new Howl({ src: ['/sounds/ticking.mp3'], volume: 0.7, preload: true });
    this.bombSound = new Howl({ src: ['/sounds/bomb.mp3'], volume: 1, preload: true });
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