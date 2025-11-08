import Matter from 'matter-js'
import { AudioManager } from './audio-manager.js'
import { ColorManager } from './color-manager.js'

export class PhysicsEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // ============================================
    // CONFIGURACIÓN DEL MOTOR DE FÍSICA
    // ============================================
    this.initializePhysicsEngine()
    
    // ============================================
    // CONFIGURACIÓN DE AUDIO
    // ============================================ 
    this.initializeAudio()
    
    // ============================================
    // CONFIGURACIÓN DE COLORES
    // ============================================
    this.initializeColors()
    
    // ============================================
    // CONFIGURACIÓN DE EVENTOS Y CONTROLES
    // ============================================
    this.setupMouseEvents()
    this.setupCollisionDetection()
    
    // ============================================
    // INICIALIZACIÓN DEL MUNDO DEL JUEGO
    // ============================================
    this.createWalls()
    this.startEngine()
    
    console.log('Motor de física inicializado con sistema de fusión')
  }
  
  // ============================================
  // MÉTODOS DE INICIALIZACIÓN
  // ============================================
  
  initializePhysicsEngine() {
    // Crear el motor de Matter.js
    this.engine = Matter.Engine.create()
    this.world = this.engine.world
    
    // Configurar la gravedad
    this.engine.world.gravity.y = 0.8
    this.engine.world.gravity.x = 0
    
    // Crear el renderer personalizado
    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: this.canvas.width,
        height: this.canvas.height,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false,
        showVelocity: false
      }
    })
    
    // Crear mouse constraint para interacción
    this.mouse = Matter.Mouse.create(this.canvas)
    this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    })
    
    // Agregar el mouse constraint al mundo
    Matter.World.add(this.world, this.mouseConstraint)
    
    // Variables para el arrastre
    this.isDragging = false
    this.draggedBody = null
  }
  
  initializeAudio() {
    // Inicializar el manager de audio
    this.audioManager = new AudioManager()
  }
  
  initializeColors() {
    // Inicializar el manager de colores
    this.colorManager = new ColorManager()
  }
  
  startEngine() {
    // Iniciar el motor
    Matter.Render.run(this.render)
    this.runner = Matter.Runner.create()
    Matter.Runner.run(this.runner, this.engine)
  }
  
  // ============================================
  // SISTEMA DE COLISIONES Y LÓGICA DE JUEGO
  // ============================================
  
  setupCollisionDetection() {
    // Escuchar eventos de colisión
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs
      
      pairs.forEach(pair => {
        const { bodyA, bodyB } = pair
        
        // Verificar primera colisión para ambas burbujas
        this.checkFirstCollision(bodyA)
        this.checkFirstCollision(bodyB)
        
        // Solo procesar colisiones entre burbujas para fusión
        if (bodyA.isBubble && bodyB.isBubble) {
          this.handleBubbleCollision(bodyA, bodyB)
        }
      })
    })
  }
  
  checkFirstCollision(body) {
    // Solo verificar burbujas que no sean paredes
    if (body.isBubble && !body.hasCollided) {
      body.hasCollided = true
      this.audioManager.playDropSound()
      console.log(`Primera colisión de burbuja con valor ${body.value}`)
    }
  }
  
  handleBubbleCollision(bubbleA, bubbleB) {
    // Verificar si la suma de los valores es múltiplo de 10
    const sum = bubbleA.value + bubbleB.value
    
    // Fusionar si es múltiplo de 10 y está entre 10 y 100
    if (sum % 10 === 0 && sum >= 10 && sum <= 100) {
      console.log(`¡FUSIÓN! ${bubbleA.value} + ${bubbleB.value} = ${sum}`)
      console.log(`Colores: ${bubbleA.color.name} + ${bubbleB.color.name}`)
      
      // Reproducir sonido de fusión aleatorio
      this.audioManager.playFusionSound()
      
      // Calcular la posición de la nueva burbuja (punto medio)
      const newX = (bubbleA.position.x + bubbleB.position.x) / 2
      const newY = (bubbleA.position.y + bubbleB.position.y) / 2
      
      // Crear la nueva burbuja fusionada con mezcla de colores
      this.createFusedBubble(newX, newY, sum, bubbleA.color, bubbleB.color)
      
      // Remover las burbujas originales
      Matter.World.remove(this.world, [bubbleA, bubbleB])
      
      // Callback para notificar al juego (puntuación, efectos, etc.)
      this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum)
    }
  }
  
  createFusedBubble(x, y, value, colorA, colorB) {
    // Tamaño dinámico según el valor de la fusión
    // Tamaño base 30px, incrementa 5px por cada nivel de fusión
    const baseRadius = 30
    const fusionLevel = value / 10 // 10=1, 20=2, 30=3, etc.
    const radius = Math.min(baseRadius + (fusionLevel * 5), 65) // Máximo 65px para 100
    
    // Mezclar colores usando RGB real
    const fusedColor = this.colorManager.mixColors(colorA, colorB)
    
    // Crear la burbuja fusionada
    const fusedBubble = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.7, // Más rebote
      friction: 0.3,
      frictionAir: 0.01,
      render: {
        fillStyle: fusedColor.fill,
        strokeStyle: fusedColor.stroke,
        lineWidth: Math.min(2 + Math.floor(fusionLevel / 2), 6) // Borde más grueso para valores altos
      },
      // Propiedades personalizadas
      isBubble: true,
      isFused: true, // Marcar como fusionada
      hasCollided: true, // Las burbujas fusionadas ya han colisionado
      fusionLevel: fusionLevel, // Nivel de fusión (1-10)
      value: value,
      color: fusedColor
    })
    
    // Agregar la nueva burbuja al mundo
    Matter.World.add(this.world, fusedBubble)
    
    console.log(`Burbuja fusionada creada: ${colorA.name} + ${colorB.name} = ${fusedColor.name}, valor ${value}, nivel ${fusionLevel}`)
    
    return fusedBubble
  }
  
  // ============================================
  // SISTEMA DE EVENTOS E INTERACCIÓN
  // ============================================
  
  setupMouseEvents() {
    // Prevenir el scroll en móviles cuando se toque el canvas
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
    }, { passive: false })
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
    }, { passive: false })
    
    // Eventos de mouse
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    
    // Eventos de touch para móviles
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this))
  }
  
  getMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }
  
  getTouchPosition(event) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    const touch = event.touches[0] || event.changedTouches[0]
    
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    }
  }
  
  findBodyAtPosition(x, y) {
    const bodies = Matter.Composite.allBodies(this.world)
    for (let body of bodies) {
      if (body.isBubble && Matter.Bounds.contains(body.bounds, { x, y })) {
        // Verificar si realmente está dentro del círculo
        const dx = x - body.position.x
        const dy = y - body.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= body.circleRadius) {
          return body
        }
      }
    }
    return null
  }
  
  // Eventos de mouse
  onMouseDown(event) {
    const mousePos = this.getMousePosition(event)
    const body = this.findBodyAtPosition(mousePos.x, mousePos.y)
    
    if (body) {
      this.isDragging = true
      this.draggedBody = body
      
      // Cambiar el cursor
      this.canvas.style.cursor = 'grabbing'
      
      // Reducir la gravedad del objeto arrastrado
      Matter.Body.setStatic(body, true)
    }
  }
  
  onMouseMove(event) {
    if (this.isDragging && this.draggedBody) {
      const mousePos = this.getMousePosition(event)
      Matter.Body.setPosition(this.draggedBody, { x: mousePos.x, y: mousePos.y })
    } else {
      // Cambiar cursor cuando esté sobre una burbuja
      const mousePos = this.getMousePosition(event)
      const body = this.findBodyAtPosition(mousePos.x, mousePos.y)
      this.canvas.style.cursor = body ? 'grab' : 'default'
    }
  }
  
  onMouseUp(event) {
    if (this.isDragging && this.draggedBody) {
      // Restaurar las propiedades físicas
      Matter.Body.setStatic(this.draggedBody, false)
      
      // Agregar un pequeño impulso basado en el movimiento del mouse
      const mousePos = this.getMousePosition(event)
      const force = {
        x: (mousePos.x - this.draggedBody.position.x) * 0.001,
        y: (mousePos.y - this.draggedBody.position.y) * 0.001
      }
      Matter.Body.applyForce(this.draggedBody, this.draggedBody.position, force)
      
      this.isDragging = false
      this.draggedBody = null
      this.canvas.style.cursor = 'default'
    }
  }
  
  // Eventos de touch (móvil)
  onTouchStart(event) {
    const touchPos = this.getTouchPosition(event)
    const body = this.findBodyAtPosition(touchPos.x, touchPos.y)
    
    if (body) {
      this.isDragging = true
      this.draggedBody = body
      Matter.Body.setStatic(body, true)
    }
  }
  
  onTouchMove(event) {
    if (this.isDragging && this.draggedBody) {
      const touchPos = this.getTouchPosition(event)
      Matter.Body.setPosition(this.draggedBody, { x: touchPos.x, y: touchPos.y })
    }
  }
  
  onTouchEnd(event) {
    if (this.isDragging && this.draggedBody) {
      Matter.Body.setStatic(this.draggedBody, false)
      
      this.isDragging = false
      this.draggedBody = null
    }
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
    
    // Seleccionar un color aleatorio
    const selectedColor = this.colorManager.getRandomColor()
    
    // Crear el círculo/burbuja
    const bubble = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.6, // Rebote
      friction: 0.3,
      frictionAir: 0.01, // Resistencia al aire
      render: {
        fillStyle: selectedColor.fill,
        strokeStyle: selectedColor.stroke,
        lineWidth: 2
      },
      // Propiedades personalizadas del juego
      isBubble: true,
      hasCollided: false, // Para rastrear primera colisión
      value: Math.floor(Math.random() * 9) + 1, // Número del 1 al 9
      color: selectedColor // Guardar el color para uso posterior
    })
    
    // Agregar la burbuja al mundo
    Matter.World.add(this.world, bubble)
    
    console.log(`Burbuja creada en x: ${x}, valor: ${bubble.value}, color: ${selectedColor.name}`)
    
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
    const isBeingDragged = this.draggedBody === body
    const isFused = body.isFused || false
    const fusionLevel = body.fusionLevel || 0
    const color = body.color || { fill: '#3B82F6', stroke: '#1E40AF' }
    
    this.ctx.save()
    this.ctx.translate(pos.x, pos.y)
    this.ctx.rotate(body.angle)
    
    // Dibujar el círculo con color plano
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    
    // Solo color plano, sin gradientes ni sombras
    this.ctx.fillStyle = color.fill
    this.ctx.fill()
    
    // Borde simple
    this.ctx.strokeStyle = color.stroke
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    
    // Dibujar el número
    this.ctx.fillStyle = 'white'
    const fontSize = Math.min(20 + fusionLevel * 3, 40) // Tipografía más grande: base 20px, hasta 40px
    this.ctx.font = `bold ${fontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.lineWidth = Math.min(4 + fusionLevel, 8) // Contorno más grueso también
    this.ctx.strokeText(body.value.toString(), 0, 0)
    this.ctx.fillText(body.value.toString(), 0, 0)
    
    // Agregar rayita para diferenciar 6 y 9
    if (body.value === 6 || body.value === 9) {
      const underlineY = fontSize * 0.5 // Posición debajo del número
      const underlineWidth = fontSize * 0.6 // Ancho de la rayita
      
      this.ctx.beginPath()
      this.ctx.moveTo(-underlineWidth / 2, underlineY)
      this.ctx.lineTo(underlineWidth / 2, underlineY)
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = Math.max(2, fontSize * 0.08) // Grosor proporcional
      this.ctx.stroke()
    }
    
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
    // Remover event listeners
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this))
    this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this))
    this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this))
    
    // Limpiar Matter.js
    Matter.Render.stop(this.render)
    Matter.Runner.stop(this.runner)
    Matter.Engine.clear(this.engine)
    
    // Limpiar audio
    if (this.audioManager) {
      this.audioManager.destroy()
    }
  }
}