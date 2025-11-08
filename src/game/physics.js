import Matter from 'matter-js'
import { AudioManager } from './audio-manager.js'
import { ColorManager } from './color-manager.js'
import { BubbleFactory } from './bubble-factory.js'
import { ScoreManager } from './score-manager.js'

export class GamePhysics {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // Game state
    this.isGameOver = false
    this.dangerLineY = null
    this.onGameOver = null // Callback para cuando se termine el juego
    
    this.initializePhysicsEngine()
    this.initializeAudio()
    this.initializeColors()
    this.initializeBubbleFactory()
    this.initializeScore()
    this.setupMouseEvents()
    this.setupCollisionDetection()
    this.createWalls()
    this.startEngine()
    
    // Establecer línea de peligro
    this.updateDangerLine()
    
    console.log('Motor de física inicializado con sistema de fusión')
  }
  
  initializePhysicsEngine() {
    this.engine = Matter.Engine.create()
    this.world = this.engine.world
    this.engine.world.gravity.y = 0.8
    this.engine.world.gravity.x = 0
    
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
    
    Matter.World.add(this.world, this.mouseConstraint)
    this.isDragging = false
    this.draggedBody = null
  }
  
  initializeAudio() {
    this.audioManager = new AudioManager()
  }
  
  initializeColors() {
    this.colorManager = new ColorManager()
  }

  initializeBubbleFactory() {
    this.bubbleFactory = new BubbleFactory(this.world, this.canvas, this.colorManager)
  }

  initializeScore() {
    this.scoreManager = new ScoreManager()
  }
  
  startEngine() {
    Matter.Render.run(this.render)
    this.runner = Matter.Runner.create()
    Matter.Runner.run(this.runner, this.engine)
  }

  updateDangerLine() {
    this.dangerLineY = this.canvas.height * 0.1 // 10% desde arriba
  }

  checkGameOver() {
    if (this.isGameOver) return false
    
    // Calcular altura del montón de burbujas estáticas
    const staticPileHeight = this.calculateStaticPileHeight()
    
    // Game over si el montón supera el 90% de la altura
    const maxAllowedHeight = this.canvas.height * 0.9
    if (staticPileHeight > maxAllowedHeight) {
      this.triggerGameOver()
      return true
    }
    return false
  }

  calculateStaticPileHeight() {
    const bodies = Matter.Composite.allBodies(this.world)
    const bubbles = bodies.filter(body => body.isBubble)
    
    // Actualizar estado de movimiento para cada burbuja
    this.updateBubbleMovementState(bubbles)
    
    // Filtrar solo burbujas que están estáticas Y no están siendo arrastradas
    const staticBubbles = bubbles.filter(bubble => 
      this.isBubbleStatic(bubble) && bubble !== this.draggedBody
    )
    
    if (staticBubbles.length === 0) return 0
    
    // Encontrar la burbuja más alta (menor Y) entre las estáticas
    const highestBubble = staticBubbles.reduce((highest, bubble) => {
      const bubbleTop = bubble.position.y - bubble.circleRadius
      const highestTop = highest.position.y - highest.circleRadius
      return bubbleTop < highestTop ? bubble : highest
    })
    
    const pileTop = highestBubble.position.y - highestBubble.circleRadius
    const pileHeight = this.canvas.height - pileTop
    
    return pileHeight
  }

  updateBubbleMovementState(bubbles) {
    const currentTime = Date.now()
    
    bubbles.forEach(bubble => {
      // Si está siendo arrastrada, no es estática
      if (bubble === this.draggedBody) {
        bubble.staticTime = 0
        bubble.lastMoveTime = currentTime
        bubble.lastPosition = { x: bubble.position.x, y: bubble.position.y }
        return
      }
      
      if (!bubble.lastPosition) {
        bubble.lastPosition = { x: bubble.position.x, y: bubble.position.y }
        bubble.lastMoveTime = currentTime
        bubble.staticTime = 0
        return
      }
      
      const distance = Math.sqrt(
        Math.pow(bubble.position.x - bubble.lastPosition.x, 2) +
        Math.pow(bubble.position.y - bubble.lastPosition.y, 2)
      )
      
      // Si se movió más de 1 pixel, no está estática
      if (distance > 1) {
        bubble.lastPosition = { x: bubble.position.x, y: bubble.position.y }
        bubble.lastMoveTime = currentTime
        bubble.staticTime = 0
      } else {
        // Calcular tiempo estática
        bubble.staticTime = currentTime - bubble.lastMoveTime
      }
    })
  }

  isBubbleStatic(bubble) {
    // Una burbuja se considera estática si no se ha movido por 1 segundo
    return bubble.staticTime && bubble.staticTime > 1000
  }

  triggerGameOver() {
    this.isGameOver = true
    console.log('¡GAME OVER! El montón de burbujas ha alcanzado el límite de altura')
    
    // Detener el motor de física
    if (this.runner) {
      Matter.Runner.stop(this.runner)
    }
    
    if (this.onGameOver) {
      this.onGameOver()
    }
  }
  
  setupCollisionDetection() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs
      
      pairs.forEach(pair => {
        const { bodyA, bodyB } = pair
        
        this.checkFirstCollision(bodyA)
        this.checkFirstCollision(bodyB)
        
        if (bodyA.isBubble && bodyB.isBubble) {
          this.handleBubbleCollision(bodyA, bodyB)
        }
      })
    })
  }
  
  checkFirstCollision(body) {
    if (body.isBubble && !body.hasCollided) {
      body.hasCollided = true
      this.audioManager.playDropSound()
    }
  }
  
  handleBubbleCollision(bubbleA, bubbleB) {
    const sum = bubbleA.value + bubbleB.value
    
    if (sum % 10 === 0 && sum >= 10 && sum <= 100) {
      
      this.audioManager.playFusionSound()
      
      const newX = (bubbleA.position.x + bubbleB.position.x) / 2
      const newY = (bubbleA.position.y + bubbleB.position.y) / 2
      
      this.createFusedBubble(newX, newY, sum, bubbleA.color, bubbleB.color)
      
      Matter.World.remove(this.world, [bubbleA, bubbleB])
      
      const pointsEarned = this.scoreManager.addScore(bubbleA.value, bubbleB.value, sum)
      this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum, pointsEarned)
    }
  }
  
  createFusedBubble(x, y, value, colorA, colorB) {
    const baseRadius = 30
    const fusionLevel = value / 10
    const radius = Math.min(baseRadius + (fusionLevel * 5), 65)
    
    const fusedColor = this.colorManager.mixColors(colorA, colorB)
    
    const fusedBubble = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.7,
      friction: 0.3,
      frictionAir: 0.01,
      render: {
        fillStyle: fusedColor.fill,
        strokeStyle: fusedColor.stroke,
        lineWidth: Math.min(2 + Math.floor(fusionLevel / 2), 6)
      },
      isBubble: true,
      isFused: true,
      hasCollided: true,
      fusionLevel: fusionLevel,
      value: value,
      color: fusedColor
    })
    
    Matter.World.add(this.world, fusedBubble)
    return fusedBubble
  }
  
  setupMouseEvents() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
    }, { passive: false })
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
    }, { passive: false })
    
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    
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
  
  onMouseDown(event) {
    // No permitir interacción si el juego terminó
    if (this.isGameOver) return
    
    const mousePos = this.getMousePosition(event)
    const body = this.findBodyAtPosition(mousePos.x, mousePos.y)
    
    if (body) {
      this.isDragging = true
      this.draggedBody = body
      
      this.canvas.style.cursor = 'grabbing'
      
      Matter.Body.setStatic(body, true)
    }
  }
  
  onMouseMove(event) {
    // No permitir interacción si el juego terminó
    if (this.isGameOver) return
    
    if (this.isDragging && this.draggedBody) {
      const mousePos = this.getMousePosition(event)
      Matter.Body.setPosition(this.draggedBody, { x: mousePos.x, y: mousePos.y })
    } else {
      const mousePos = this.getMousePosition(event)
      const body = this.findBodyAtPosition(mousePos.x, mousePos.y)
      this.canvas.style.cursor = body ? 'grab' : 'default'
    }
  }
  
  onMouseUp(event) {
    if (this.isDragging && this.draggedBody) {
      Matter.Body.setStatic(this.draggedBody, false)
      
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
    
    const walls = [
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
        isStatic: true,
        render: { visible: false }
      }),
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { visible: false }
      }),
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { visible: false }
      })
    ]
    
    Matter.World.add(this.world, walls)
  }
  
  customRender() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Dibujar línea de peligro dinámica basada en el montón
    this.drawDynamicDangerLine()
    
    const bodies = Matter.Composite.allBodies(this.world)
    
    bodies.forEach(body => {
      if (body.isBubble) {
        this.drawBubble(body)
      }
    })
    
    // Dibujar pantalla de Game Over si el juego terminó
    if (this.isGameOver) {
      this.drawGameOverScreen()
    }
  }

  drawGameOverScreen() {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    this.ctx.save()
    
    // Fondo semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Recuadro principal
    const boxWidth = Math.min(400, this.canvas.width * 0.8)
    const boxHeight = Math.min(200, this.canvas.height * 0.4)
    const boxX = centerX - boxWidth / 2
    const boxY = centerY - boxHeight / 2
    
    // Fondo del recuadro
    this.ctx.fillStyle = '#FF4444'
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    
    // Borde del recuadro
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)
    
    // Texto "GAME OVER"
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('GAME OVER', centerX, centerY - 20)
    
    // Texto secundario
    this.ctx.font = '20px Arial'
    this.ctx.fillText('Las burbujas alcanzaron el límite', centerX, centerY + 20)
    
    // Texto de reinicio
    this.ctx.font = '16px Arial'
    this.ctx.fillStyle = '#FFCCCC'
    this.ctx.fillText('Recarga la página para jugar de nuevo', centerX, centerY + 50)
    
    this.ctx.restore()
  }

  drawDynamicDangerLine() {
    const staticPileHeight = this.calculateStaticPileHeight()
    const maxAllowedHeight = this.canvas.height * 0.9
    
    // Línea de referencia al 90%
    const dangerY = this.canvas.height - maxAllowedHeight
    
    this.ctx.save()
    
    // Línea de peligro (90% de altura)
    this.ctx.strokeStyle = '#FF0000'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([10, 5])
    
    this.ctx.beginPath()
    this.ctx.moveTo(0, dangerY)
    this.ctx.lineTo(this.canvas.width, dangerY)
    this.ctx.stroke()
    
    // Línea del montón actual (verde si seguro, amarilla si cerca del peligro)
    if (staticPileHeight > 0) {
      const pileY = this.canvas.height - staticPileHeight
      const dangerRatio = staticPileHeight / maxAllowedHeight
      
      if (dangerRatio > 0.8) {
        this.ctx.strokeStyle = '#FFA500' // Naranja - peligro
      } else if (dangerRatio > 0.6) {
        this.ctx.strokeStyle = '#FFFF00' // Amarillo - advertencia  
      } else {
        this.ctx.strokeStyle = '#00FF00' // Verde - seguro
      }
      
      this.ctx.setLineDash([5, 3])
      this.ctx.lineWidth = 2
      
      this.ctx.beginPath()
      this.ctx.moveTo(0, pileY)
      this.ctx.lineTo(this.canvas.width, pileY)
      this.ctx.stroke()
    }
    
    this.ctx.setLineDash([])
    this.ctx.restore()
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
    
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    
    this.ctx.fillStyle = color.fill
    this.ctx.fill()
    
    this.ctx.strokeStyle = color.stroke
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    
    this.ctx.fillStyle = 'white'
    const fontSize = Math.min(20 + fusionLevel * 3, 40) // Tipografía más grande: base 20px, hasta 40px
    this.ctx.font = `bold ${fontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.lineWidth = Math.min(4 + fusionLevel, 8) // Contorno más grueso también
    this.ctx.strokeText(body.value.toString(), 0, 0)
    this.ctx.fillText(body.value.toString(), 0, 0)
    
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
  
  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    this.render.options.width = width
    this.render.options.height = height
    
    // Actualizar línea de peligro con nuevas dimensiones
    this.updateDangerLine()
    
    const bodies = Matter.Composite.allBodies(this.world)
    const walls = bodies.filter(body => body.isStatic)
    Matter.World.remove(this.world, walls)
    this.createWalls()
  }
  
  destroy() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this))
    this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this))
    this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this))
    
    Matter.Render.stop(this.render)
    Matter.Runner.stop(this.runner)
    Matter.Engine.clear(this.engine)
    
    if (this.audioManager) {
      this.audioManager.destroy()
    }
  }
}