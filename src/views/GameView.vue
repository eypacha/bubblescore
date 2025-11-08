<template>
  <div class="game-container min-h-screen bg-gray-50 flex items-center justify-center">
    <!-- Panel de puntaje -->
    <div class="score-panel absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-10">
      <div class="text-sm text-gray-500 font-medium uppercase tracking-wide">Puntaje</div>
      <div class="text-3xl font-bold text-blue-600 mt-1">{{ score.toLocaleString() }}</div>
      <div v-if="lastFusion.points > 0" class="text-xs text-green-600 font-medium mt-2 animate-pulse">
        +{{ lastFusion.points }} pts ({{ lastFusion.fusion }})
      </div>
    </div>

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

// Estado del puntaje
const score = ref(0)
const lastFusion = ref({
  points: 0,
  fusion: '',
  timestamp: 0
})

let physicsEngine = null
let animationId = null
let bubbleInterval = null
let fusionAnimationTimeout = null

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
    // Verificar game over solo si el juego no ha terminado
    if (!physicsEngine.isGameOver) {
      physicsEngine.checkGameOver()
    }
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
    
    updateCanvasSize()
    
    physicsEngine.onBubbleFusion = (valueA, valueB, sum, pointsEarned) => {
      console.log(`¡Fusión exitosa! ${valueA} + ${valueB} = ${sum} (+${pointsEarned} pts)`)
      score.value = physicsEngine.scoreManager.getScore()
      
      // Mostrar animación de puntos ganados
      lastFusion.value = {
        points: pointsEarned,
        fusion: `${valueA}+${valueB}=${sum}`,
        timestamp: Date.now()
      }
      
      // Limpiar la animación después de 3 segundos
      if (fusionAnimationTimeout) {
        clearTimeout(fusionAnimationTimeout)
      }
      fusionAnimationTimeout = setTimeout(() => {
        lastFusion.value = { points: 0, fusion: '', timestamp: 0 }
      }, 3000)
    }
    
    physicsEngine.scoreManager.onScoreUpdate = (newScore, pointsAdded) => {
      score.value = newScore
    }
    
    physicsEngine.onGameOver = () => {
      console.log('¡GAME OVER!')
      stopBubbleGeneration()
      // Resetear el puntaje si se quiere empezar de nuevo
      // physicsEngine.scoreManager.reset()
      // score.value = 0
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
    if (fusionAnimationTimeout) {
      clearTimeout(fusionAnimationTimeout)
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
  position: relative;
}

.score-panel {
  min-width: 180px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.score-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>