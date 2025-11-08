import Matter from 'matter-js'

export class BubbleFactory {
  constructor(world, canvas, colorManager) {
    this.world = world
    this.canvas = canvas
    this.colorManager = colorManager
    
    // Sistema de bolsas estilo Tetris
    this.valueBag = []
    this.fillBag()
    
    // Sistema de bombas
    this.bombCounter = 0
    this.bombSpawnRate = 25
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
    // Determinar si crear una bomba o una burbuja reloj
    this.bombCounter++ // Increment bomb counter
    const shouldCreateBomb = this.bombCounter >= this.bombSpawnRate && Math.random() < 0.3 // Allow multiple bombs
    const shouldCreateClock = Math.random() < 0.07 // 7% de probabilidad
    if (shouldCreateClock) {
      return this.createClockBubble(x, y, radius)
    } else if (shouldCreateBomb) {
      return this.createBomb(x, y, radius)
    } else {
      return this.createNormalBubble(x, y, radius)
    }
  }

  createClockBubble(x, y, radius) {
  const collisionRadius = Math.max(radius * 0.85, 24)
    const bubble = Matter.Bodies.circle(x, y, collisionRadius, {
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.01,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'transparent',
        lineWidth: 0
      },
      isBubble: true,
      isClock: true,
      hasCollided: false,
      value: '⏰',
      color: { fill: 'transparent', stroke: 'transparent', name: 'clock' },
      clockTimer: BUBBLE_TIMER / 1000
    })
    Matter.World.add(this.world, bubble)
    return bubble
  }

  createNormalBubble(x, y, radius) {
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

  createBomb(x, y, radius) {
  this.bombCounter = 0
    
    const bomb = Matter.Bodies.circle(x, y, radius + 5, { 
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.01,
      render: {
        fillStyle: '#1a1a1a',
        strokeStyle: '#ff4444',
        lineWidth: 3
      },
      isBubble: true,
      isBomb: true,
      hasCollided: false,
      bombTimer: 3,
      color: { fill: '#1a1a1a', stroke: '#ff4444', name: 'bomb' }
    })
    
    Matter.World.add(this.world, bomb)
    return bomb
  }


  reset() {
    // Reiniciar la bolsa de valores para un nuevo juego
    this.valueBag = []
    this.fillBag()
    
    // Reiniciar sistema de bombas
    this.bombCounter = 0
  }
}