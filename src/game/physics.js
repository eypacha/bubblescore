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
    
    this.initializePhysicsEngine()
    this.initializeAudio()
    this.initializeColors()
    this.initializeBubbleFactory()
    this.initializeScore()
    this.setupMouseEvents()
    this.setupCollisionDetection()
    this.createWalls()
    this.startEngine()
    
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
      
      const scoreResult = this.scoreManager.addScore(bubbleA.value, bubbleB.value, sum, bubbleA, bubbleB)
      this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum, scoreResult.totalPoints, scoreResult.colorBonus)
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