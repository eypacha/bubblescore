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
        <p class="text-gray-600 text-sm mb-2">
          <strong>Objetivo:</strong> Haz que dos burbujas que sumen múltiplos de 10 colisionen para fusionarlas
        </p>
        <p class="text-gray-500 text-xs mb-1">
          Fusiones válidas: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 • Los colores se mezclan
        </p>
        <p class="text-gray-500 text-xs">
          Burbujas caen automáticamente • Haz clic para crear más • Arrastra para moverlas
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { GamePhysics } from '../game/physics.js'

const gameCanvas = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)

let physicsEngine = null
let animationId = null
let bubbleInterval = null

const BUBBLE_SPAWN_INTERVAL = 2000 

const createBubble = () => {
  if (physicsEngine && physicsEngine.bubbleFactory) {
    physicsEngine.bubbleFactory.createBubble()
  }
}

const startBubbleGeneration = () => {
  createBubble()
  
  bubbleInterval = setInterval(() => {
    createBubble()
  }, BUBBLE_SPAWN_INTERVAL)
  
  console.log('Generación automática de burbujas iniciada')
}

const stopBubbleGeneration = () => {
  if (bubbleInterval) {
    clearInterval(bubbleInterval)
    bubbleInterval = null
    console.log('Generación automática de burbujas detenida')
  }
}

const gameLoop = () => {
  if (physicsEngine) {
    physicsEngine.customRender()
  }
  animationId = requestAnimationFrame(gameLoop)
}

const initializeGame = () => {
  const updateCanvasSize = () => {
    const maxWidth = Math.min(window.innerWidth - 40, 900)
    const maxHeight = Math.min(window.innerHeight - 40, 600)
    
    canvasWidth.value = maxWidth
    canvasHeight.value = maxHeight
    
    if (physicsEngine) {
      physicsEngine.resize(maxWidth, maxHeight)
    }
  }
  
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  
  if (gameCanvas.value) {
    physicsEngine = new GamePhysics(gameCanvas.value)
    
    physicsEngine.onBubbleFusion = (valueA, valueB, sum) => {
      console.log(`¡Fusión exitosa! ${valueA} + ${valueB} = ${sum}`)
    }
    
    gameLoop()
    
    setTimeout(() => {
      startBubbleGeneration()
    }, 500)
  }
  
  return () => {
    window.removeEventListener('resize', updateCanvasSize)
    stopBubbleGeneration()
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (physicsEngine) {
      physicsEngine.destroy()
    }
  }
}

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