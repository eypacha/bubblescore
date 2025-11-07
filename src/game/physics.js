import Matter from 'matter-js'

export class PhysicsEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // Crear el motor de Matter.js
    this.engine = Matter.Engine.create()
    this.world = this.engine.world
    
    // Configurar la gravedad
    this.engine.world.gravity.y = 0.8
    this.engine.world.gravity.x = 0
    
    // Crear el renderer personalizado
    this.render = Matter.Render.create({
      canvas: canvas,
      engine: this.engine,
      options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false,
        showVelocity: false
      }
    })
    
    // Crear las paredes del canvas
    this.createWalls()
    
    // Iniciar el motor
    Matter.Render.run(this.render)
    this.runner = Matter.Runner.create()
    Matter.Runner.run(this.runner, this.engine)
    
    console.log('Motor de física inicializado')
  }
  
  createWalls() {
    const { width, height } = this.canvas
    const wallThickness = 50
    
    // Crear paredes invisibles
    const walls = [
      // Suelo
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
        isStatic: true,
        render: { visible: false }
      }),
      // Pared izquierda
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { visible: false }
      }),
      // Pared derecha
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { visible: false }
      })
    ]
    
    Matter.World.add(this.world, walls)
  }
  
  createBubble() {
    const { width } = this.canvas
    
    // Posición X aleatoria en la parte superior
    const x = Math.random() * (width - 100) + 50 // Margen de 50px en cada lado
    const y = -50 // Comienza arriba del canvas
    
    // Tamaño medio del círculo
    const radius = 30
    
    // Crear el círculo/burbuja
    const bubble = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.6, // Rebote
      friction: 0.3,
      frictionAir: 0.01, // Resistencia al aire
      render: {
        fillStyle: '#3B82F6', // Color azul
        strokeStyle: '#1E40AF',
        lineWidth: 2
      },
      // Propiedades personalizadas del juego
      isBubble: true,
      value: Math.floor(Math.random() * 9) + 1 // Número del 1 al 9
    })
    
    // Agregar la burbuja al mundo
    Matter.World.add(this.world, bubble)
    
    console.log(`Burbuja creada en x: ${x}, valor: ${bubble.value}`)
    
    return bubble
  }
  
  // Renderizado personalizado para mostrar números en las burbujas
  customRender() {
    // Limpiar el canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Dibujar todos los cuerpos
    const bodies = Matter.Composite.allBodies(this.world)
    
    bodies.forEach(body => {
      if (body.isBubble) {
        this.drawBubble(body)
      }
    })
  }
  
  drawBubble(body) {
    const pos = body.position
    const radius = body.circleRadius
    
    this.ctx.save()
    this.ctx.translate(pos.x, pos.y)
    this.ctx.rotate(body.angle)
    
    // Dibujar el círculo
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    this.ctx.fillStyle = '#3B82F6'
    this.ctx.fill()
    this.ctx.strokeStyle = '#1E40AF'
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    
    // Dibujar el número
    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 18px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(body.value.toString(), 0, 0)
    
    this.ctx.restore()
  }
  
  // Actualizar el tamaño del canvas
  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    this.render.options.width = width
    this.render.options.height = height
    
    // Recrear las paredes con las nuevas dimensiones
    const bodies = Matter.Composite.allBodies(this.world)
    const walls = bodies.filter(body => body.isStatic)
    Matter.World.remove(this.world, walls)
    this.createWalls()
  }
  
  // Limpiar y destruir el motor
  destroy() {
    Matter.Render.stop(this.render)
    Matter.Runner.stop(this.runner)
    Matter.Engine.clear(this.engine)
  }
}