<template>
  <div class="game-container min-h-screen bg-gray-50 flex items-center justify-center">
    <!-- Canvas del juego centrado -->
    <div class="canvas-wrapper">
      <canvas
        ref="gameCanvas"
        class="border border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="createBubble"
      ></canvas>
      
      <!-- Instrucciones simples -->
      <div class="text-center mt-4">
        <p class="text-gray-600 text-sm">
          Haz clic para crear una burbuja
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { PhysicsEngine } from '../game/physics.js'

// Referencias del canvas y dimensiones
const gameCanvas = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// Motor de física
let physicsEngine = null
let animationId = null

const createBubble = () => {
  if (physicsEngine) {
    physicsEngine.createBubble()
  }
}

const gameLoop = () => {
  if (physicsEngine) {
    physicsEngine.customRender()
  }
  animationId = requestAnimationFrame(gameLoop)
}

const initializeGame = () => {
  // Configurar dimensiones responsivas del canvas
  const updateCanvasSize = () => {
    const maxWidth = Math.min(window.innerWidth - 40, 900)
    const maxHeight = Math.min(window.innerHeight - 40, 600)
    
    canvasWidth.value = maxWidth
    canvasHeight.value = maxHeight
    
    // Actualizar el motor de física si existe
    if (physicsEngine) {
      physicsEngine.resize(maxWidth, maxHeight)
    }
  }
  
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  
  // Inicializar el motor de física
  if (gameCanvas.value) {
    physicsEngine = new PhysicsEngine(gameCanvas.value)
    
    // Crear una burbuja inicial después de un breve delay
    setTimeout(() => {
      createBubble()
    }, 500)
    
    // Iniciar el loop de renderizado personalizado
    gameLoop()
  }
  
  return () => {
    window.removeEventListener('resize', updateCanvasSize)
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (physicsEngine) {
      physicsEngine.destroy()
    }
  }
}

// Lifecycle hooks
onMounted(() => {
  const cleanup = initializeGame()
  
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style scoped>
.game-container {
  background-color: #f9fafb;
}

.canvas-wrapper {
  transition: all 0.3s ease;
}

canvas {
  display: block;
}

canvas:hover {
  border-color: #6B7280;
}
</style>