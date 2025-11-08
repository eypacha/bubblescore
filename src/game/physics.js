import Matter from 'matter-js'
import { AudioManager } from './audio-manager.js'
import { ColorManager } from './color-manager.js'
import { BubbleFactory } from './bubble-factory.js'
import { ScoreManager } from './score-manager.js'

export class GamePhysics {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    this.isGameOver = false
    this.dangerLineY = null
    this.onGameOver = null
    this.selectedBubbles = []
    this.lastClickPosition = null
    
    this.initializePhysicsEngine()
    this.initializeAudio()
    this.initializeColors()
    this.initializeBubbleFactory()
    this.initializeScore()
    this.setupClickEvents()
    this.createWalls()
    this.startEngine()
    
    this.updateDangerLine()
    
    console.log('Motor de física inicializado con sistema de click')
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
    this.setupCollisionEvents()
  }

  setupCollisionEvents() {
    // Configurar eventos de colisión para sonidos de drop
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair
        
        // Verificar si hay una burbuja que no ha colisionado antes
        if (bodyA.isBubble && !bodyA.hasCollided) {
          bodyA.hasCollided = true
          this.audioManager.playDropSound()
        } else if (bodyB.isBubble && !bodyB.hasCollided) {
          bodyB.hasCollided = true
          this.audioManager.playDropSound()
        }
      })
    })
  }

  updateDangerLine() {
    this.dangerLineY = this.canvas.height * 0.1
  }

  checkGameOver() {
    if (this.isGameOver) return false
    
    const currentTime = Date.now()
    const bodies = Matter.Composite.allBodies(this.world)
    const bubbles = bodies.filter(body => body.isBubble)
    
    bubbles.forEach(bubble => {
      const bubbleTop = bubble.position.y - bubble.circleRadius
      const dangerZone = this.dangerLineY
      
      if (bubbleTop <= dangerZone) {
        if (!bubble.dangerZoneStartTime) {
          bubble.dangerZoneStartTime = currentTime
        }
        
        const timeInDanger = currentTime - bubble.dangerZoneStartTime
        if (timeInDanger > 1000) {
          console.log(`Game Over: Burbuja en zona de peligro por ${timeInDanger}ms`)
          this.triggerGameOver()
          return true
        }
      } else {
        bubble.dangerZoneStartTime = null
      }
    })
    
    return false
  }

  triggerGameOver() {
    this.isGameOver = true
    console.log('¡GAME OVER! El montón de burbujas ha alcanzado el límite de altura')
    
    if (this.runner) {
      Matter.Runner.stop(this.runner)
    }
    
    if (this.onGameOver) {
      this.onGameOver()
    }
  }

  restart() {
    console.log('Reiniciando Physics Engine...')
    
    // Resetear estado del juego primero
    this.isGameOver = false
    this.selectedBubble = null
    this.selectedBubbles = []
    this.lastClickPosition = null
    
    // Limpiar todas las burbujas
    const bodies = Matter.Composite.allBodies(this.world)
    const bubbles = bodies.filter(body => body.isBubble)
    Matter.Composite.remove(this.world, bubbles)
    
    // Reiniciar el bubble factory
    if (this.bubbleFactory) {
      this.bubbleFactory.reset()
    }
    
    // Detener el runner actual y crear uno nuevo para asegurar un estado limpio
    Matter.Runner.stop(this.runner)
    this.runner = Matter.Runner.create()
    Matter.Runner.run(this.runner, this.engine)
    
    // Reconfigurar eventos de colisión después de reiniciar el runner
    this.setupCollisionEvents()
    
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    console.log('Physics Engine reiniciado correctamente')
  }

  setupClickEvents() {
    this.canvas.addEventListener('click', this.onBubbleClick.bind(this))
  }

  onBubbleClick(event) {
    if (this.isGameOver) return
    
    const mousePos = this.getMousePosition(event)
    this.lastClickPosition = { x: mousePos.x, y: mousePos.y }
    const clickedBubble = this.findBodyAtPosition(mousePos.x, mousePos.y)
    
    if (clickedBubble && clickedBubble.isBubble) {
      this.selectBubble(clickedBubble)
    }
  }

  selectBubble(bubble) {
    if (this.selectedBubbles.includes(bubble)) {
      this.deselectBubble(bubble)
      return
    }

    if (this.selectedBubbles.length < 2) {
      this.selectedBubbles.push(bubble)
      bubble.isSelected = true
      
      if (this.selectedBubbles.length === 2) {
        this.attemptFusion()
      }
    }
  }

  deselectBubble(bubble) {
    const index = this.selectedBubbles.indexOf(bubble)
    if (index !== -1) {
      this.selectedBubbles.splice(index, 1)
      bubble.isSelected = false
    }
  }

  clearSelection() {
    this.selectedBubbles.forEach(bubble => {
      bubble.isSelected = false
    })
    this.selectedBubbles = []
    this.lastClickPosition = null
  }

  attemptFusion() {
    const [bubbleA, bubbleB] = this.selectedBubbles
    const sum = bubbleA.value + bubbleB.value
    
    if (sum % 10 === 0 && sum >= 10 && sum <= 100) {
      this.audioManager.playFusionSound()
      
      // Calcular posición de la fusión para efectos visuales
      const fusionX = this.lastClickPosition ? this.lastClickPosition.x : (bubbleA.position.x + bubbleB.position.x) / 2
      const fusionY = this.lastClickPosition ? this.lastClickPosition.y : (bubbleA.position.y + bubbleB.position.y) / 2
      
      const scoreResult = this.scoreManager.addScore(bubbleA.value, bubbleB.value, sum, bubbleA, bubbleB)
      
      // Caso especial: fusión que resulta en 100
      if (sum === 100) {
        // La burbuja de valor 100 desaparece automáticamente y otorga puntos extra
        console.log('¡FUSIÓN PERFECTA! Burbuja de 100 desaparece automáticamente')
        
        // Remover las burbujas originales sin crear una nueva
        Matter.World.remove(this.world, [bubbleA, bubbleB])
        
        // Llamar callback con información de fusión especial y coordenadas
        this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum, scoreResult.totalPoints, scoreResult.colorBonus, true, fusionX, fusionY)
      } else {
        // Fusión normal: crear burbuja fusionada
        this.createFusedBubble(fusionX, fusionY, sum, bubbleA.color, bubbleB.color)
        Matter.World.remove(this.world, [bubbleA, bubbleB])
        
        this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum, scoreResult.totalPoints, scoreResult.colorBonus, false, fusionX, fusionY)
      }
      
      this.clearSelection()
    } else {
      this.clearSelection()
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

  getMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
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
    
    this.drawDynamicDangerLine()
    
    const bodies = Matter.Composite.allBodies(this.world)
    
    bodies.forEach(body => {
      if (body.isBubble) {
        this.drawBubble(body)
      }
    })
  }

  drawDynamicDangerLine() {
    return
  }
  
  drawBubble(body) {
    const pos = body.position
    const radius = body.circleRadius
    const isFused = body.isFused || false
    const fusionLevel = body.fusionLevel || 0
    const color = body.color || { fill: '#3B82F6', stroke: '#1E40AF' }
    const isSelected = body.isSelected || false
    
    this.ctx.save()
    this.ctx.translate(pos.x, pos.y)
    this.ctx.rotate(body.angle)
    
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    
    this.ctx.fillStyle = color.fill
    this.ctx.fill()
    
    this.ctx.strokeStyle = color.stroke
    if (isSelected) {
      this.ctx.lineWidth = 6
    } else {
      this.ctx.lineWidth = 2
    }
    this.ctx.stroke()
    
    this.ctx.fillStyle = 'white'
    const fontSize = Math.min(20 + fusionLevel * 3, 40)
    this.ctx.font = `bold ${fontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.lineWidth = Math.min(4 + fusionLevel, 8)
    this.ctx.strokeText(body.value.toString(), 0, 0)
    this.ctx.fillText(body.value.toString(), 0, 0)
    
    if (body.value === 6 || body.value === 9) {
      const underlineY = fontSize * 0.5
      const underlineWidth = fontSize * 0.6
      
      this.ctx.beginPath()
      this.ctx.moveTo(-underlineWidth / 2, underlineY)
      this.ctx.lineTo(underlineWidth / 2, underlineY)
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = Math.max(2, fontSize * 0.08)
      this.ctx.stroke()
    }
    
    this.ctx.restore()
  }
  
  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    this.render.options.width = width
    this.render.options.height = height
    
    this.updateDangerLine()
    
    const bodies = Matter.Composite.allBodies(this.world)
    const walls = bodies.filter(body => body.isStatic)
    Matter.World.remove(this.world, walls)
    this.createWalls()
  }
  
  destroy() {
    this.canvas.removeEventListener('click', this.onBubbleClick.bind(this))
    
    Matter.Render.stop(this.render)
    Matter.Runner.stop(this.runner)
    Matter.Engine.clear(this.engine)
    
    if (this.audioManager) {
      this.audioManager.destroy()
    }
  }
}