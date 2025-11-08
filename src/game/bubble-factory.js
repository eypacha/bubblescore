import Matter from 'matter-js'

export class BubbleFactory {
  constructor(world, canvas, colorManager) {
    this.world = world
    this.canvas = canvas
    this.colorManager = colorManager
  }

  createBubble() {
    const { width } = this.canvas
    const x = Math.random() * (width - 100) + 50
    const y = -50
    const radius = 30
    const selectedColor = this.colorManager.getRandomColor()
    
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
      value: Math.floor(Math.random() * 9) + 1,
      color: selectedColor
    })
    
    Matter.World.add(this.world, bubble)
    console.log(`Burbuja creada en x: ${x}, valor: ${bubble.value}, color: ${selectedColor.name}`)
    return bubble
  }
}