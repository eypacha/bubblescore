import Matter from 'matter-js'

export class BubbleFactory {
  constructor(world, canvas, colorManager) {
    this.world = world
    this.canvas = canvas
    this.colorManager = colorManager
    
    // Sistema de bolsas estilo Tetris
    this.valueBag = []
    this.fillBag()
  }

  fillBag() {
    this.valueBag = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    for (let i = this.valueBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.valueBag[i], this.valueBag[j]] = [this.valueBag[j], this.valueBag[i]]
    }
  }

  getNextValue() {
    if (this.valueBag.length === 0) {
      this.fillBag()
    }
    return this.valueBag.pop()
  }

  createBubble() {
    const { width } = this.canvas
    const x = Math.random() * (width - 100) + 50
    const y = -50
    const radius = 30
    const selectedColor = this.colorManager.getRandomColor()
    const value = this.getNextValue()
    
    const bubble = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.01,
      render: {
        fillStyle: selectedColor.fill,
        strokeStyle: selectedColor.stroke,
        lineWidth: 2
      },
      isBubble: true,
      hasCollided: false,
      value: value,
      color: selectedColor
    })
    
    Matter.World.add(this.world, bubble)
    return bubble
  }

  reset() {
    // Reiniciar la bolsa de valores para un nuevo juego
    this.valueBag = []
    this.fillBag()
  }
}