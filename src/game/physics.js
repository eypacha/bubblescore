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
    
    // Crear mouse constraint para interacción
    this.mouse = Matter.Mouse.create(canvas)
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
    
    // Eventos de mouse/touch
    this.setupMouseEvents()
    
    // Configurar detección de colisiones
    this.setupCollisionDetection()
    
    // Crear las paredes del canvas
    this.createWalls()
    
    // Iniciar el motor
    Matter.Render.run(this.render)
    this.runner = Matter.Runner.create()
    Matter.Runner.run(this.runner, this.engine)
    
    console.log('Motor de física inicializado con sistema de fusión')
  }
  
  setupCollisionDetection() {
    // Escuchar eventos de colisión
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs
      
      pairs.forEach(pair => {
        const { bodyA, bodyB } = pair
        
        // Solo procesar colisiones entre burbujas
        if (bodyA.isBubble && bodyB.isBubble) {
          this.handleBubbleCollision(bodyA, bodyB)
        }
      })
    })
  }
  
  handleBubbleCollision(bubbleA, bubbleB) {
    // Verificar si la suma de los valores es múltiplo de 10
    const sum = bubbleA.value + bubbleB.value
    
    // Fusionar si es múltiplo de 10 y está entre 10 y 100
    if (sum % 10 === 0 && sum >= 10 && sum <= 100) {
      console.log(`¡Fusión! ${bubbleA.value} + ${bubbleB.value} = ${sum}`)
      
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
    
    // Mezclar colores según las combinaciones
    const fusedColor = this.mixColors(colorA.name, colorB.name)
    
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
      fusionLevel: fusionLevel, // Nivel de fusión (1-10)
      value: value,
      color: fusedColor
    })
    
    // Agregar la nueva burbuja al mundo
    Matter.World.add(this.world, fusedBubble)
    
    console.log(`Burbuja fusionada creada: ${colorA.name} + ${colorB.name} = ${fusedColor.name}, valor ${value}, nivel ${fusionLevel}`)
    
    return fusedBubble
  }
  
  mixColors(colorNameA, colorNameB) {
    // Definir todas las combinaciones posibles de colores primarios
    const colorMixes = {
      // Mismo color (sin mezcla)
      'red-red': { fill: '#EF4444', stroke: '#DC2626', name: 'red' },
      'yellow-yellow': { fill: '#F59E0B', stroke: '#D97706', name: 'yellow' },
      'blue-blue': { fill: '#3B82F6', stroke: '#1E40AF', name: 'blue' },
      
      // Mezclas de colores primarios (colores secundarios)
      'red-yellow': { fill: '#F97316', stroke: '#EA580C', name: 'orange' },    // Rojo + Amarillo = Naranja
      'yellow-red': { fill: '#F97316', stroke: '#EA580C', name: 'orange' },    // Amarillo + Rojo = Naranja
      
      'red-blue': { fill: '#8B5CF6', stroke: '#7C3AED', name: 'purple' },      // Rojo + Azul = Púrpura
      'blue-red': { fill: '#8B5CF6', stroke: '#7C3AED', name: 'purple' },      // Azul + Rojo = Púrpura
      
      'yellow-blue': { fill: '#10B981', stroke: '#059669', name: 'green' },    // Amarillo + Azul = Verde
      'blue-yellow': { fill: '#10B981', stroke: '#059669', name: 'green' }     // Azul + Amarillo = Verde
    }
    
    // Crear la clave de búsqueda
    const mixKey = `${colorNameA}-${colorNameB}`
    
    // Buscar la combinación o devolver un color por defecto
    const mixedColor = colorMixes[mixKey] || { fill: '#6B7280', stroke: '#4B5563', name: 'gray' }
    
    console.log(`Mezcla de colores: ${colorNameA} + ${colorNameB} = ${mixedColor.name}`)
    
    return mixedColor
  }
  
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
    
    // Solo 3 colores primarios
    const colors = [
      { fill: '#EF4444', stroke: '#DC2626', name: 'red' },     // Rojo
      { fill: '#F59E0B', stroke: '#D97706', name: 'yellow' },  // Amarillo
      { fill: '#3B82F6', stroke: '#1E40AF', name: 'blue' }     // Azul
    ]
    
    // Seleccionar un color aleatorio
    const colorIndex = Math.floor(Math.random() * colors.length)
    const selectedColor = colors[colorIndex]
    
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
    
    // Efectos especiales para burbujas fusionadas
    if (isFused) {
      // Efecto de pulso más intenso según el nivel de fusión
      const pulseIntensity = Math.min(0.05 + (fusionLevel * 0.02), 0.2) // Máximo 20%
      const pulseSpeed = 0.003 + (fusionLevel * 0.001) // Más rápido para niveles altos
      const pulseScale = 1 + Math.sin(Date.now() * pulseSpeed) * pulseIntensity
      this.ctx.scale(pulseScale, pulseScale)
    }
    
    // Dibujar el círculo con gradiente y efectos
    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
    
    if (isBeingDragged) {
      // Crear gradiente para efecto de arrastre
      const gradient = this.ctx.createRadialGradient(-5, -5, 0, 0, 0, radius)
      gradient.addColorStop(0, this.lightenColor(color.fill, 30))
      gradient.addColorStop(1, color.fill)
      this.ctx.fillStyle = gradient
      
      // Sombra para efecto de elevación
      this.ctx.shadowColor = color.stroke
      this.ctx.shadowBlur = 15
      this.ctx.shadowOffsetX = 2
      this.ctx.shadowOffsetY = 2
    } else if (isFused) {
      // Gradientes especiales según el nivel de fusión
      const gradient = this.ctx.createRadialGradient(-8, -8, 0, 0, 0, radius)
      
      // Intensidad del brillo según el nivel
      const lightness = Math.min(20 + (fusionLevel * 10), 80)
      
      gradient.addColorStop(0, this.lightenColor(color.fill, lightness))
      gradient.addColorStop(0.4, this.lightenColor(color.fill, lightness / 2))
      gradient.addColorStop(0.8, color.fill)
      gradient.addColorStop(1, this.darkenColor(color.fill, 20))
      
      // Sombra más intensa para niveles altos
      const shadowIntensity = Math.min(5 + fusionLevel * 2, 20)
      this.ctx.shadowColor = color.stroke
      this.ctx.shadowBlur = shadowIntensity
      this.ctx.shadowOffsetX = Math.min(2 + fusionLevel, 5)
      this.ctx.shadowOffsetY = Math.min(2 + fusionLevel, 5)
      
      this.ctx.fillStyle = gradient
    } else {
      // Gradiente normal
      const gradient = this.ctx.createRadialGradient(-8, -8, 0, 0, 0, radius)
      gradient.addColorStop(0, this.lightenColor(color.fill, 15))
      gradient.addColorStop(1, color.fill)
      this.ctx.fillStyle = gradient
      
      // Sombra sutil
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      this.ctx.shadowBlur = 3
      this.ctx.shadowOffsetX = 1
      this.ctx.shadowOffsetY = 1
    }
    
    this.ctx.fill()
    
    // Resetear sombra para el borde
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
    
    // Dibujar el borde
    const borderWidth = Math.min(2 + fusionLevel, 6) // Borde más grueso para niveles altos
    this.ctx.strokeStyle = isBeingDragged ? this.darkenColor(color.stroke, 20) : color.stroke
    this.ctx.lineWidth = borderWidth
    this.ctx.stroke()
    
    // Dibujar pequeño highlight para efecto 3D
    this.ctx.beginPath()
    this.ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, Math.PI * 2)
    const highlightOpacity = Math.min(0.3 + (fusionLevel * 0.05), 0.8)
    this.ctx.fillStyle = `rgba(255, 255, 255, ${highlightOpacity})`
    this.ctx.fill()
    
    // Dibujar el número
    this.ctx.fillStyle = 'white'
    const fontSize = Math.min(14 + fusionLevel * 2, 28) // Texto más grande para valores altos
    this.ctx.font = `bold ${fontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.lineWidth = Math.min(3 + fusionLevel, 6)
    this.ctx.strokeText(body.value.toString(), 0, 0)
    this.ctx.fillText(body.value.toString(), 0, 0)
    
    this.ctx.restore()
  }
  
  // Función auxiliar para aclarar colores
  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }
  
  // Función auxiliar para oscurecer colores
  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)
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
  }
}