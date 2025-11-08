<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="mb-4 w-full max-w-4xl md:flex-row md:items-center md:gap-0">
      <div class="flex justify-between items-center flex-col gap-4 items-start md:flex-row md:gap-6 md:items-center">
        <div class="flex items-center gap-6">
          <div>
            <div class="text-sm text-gray-500 font-medium uppercase tracking-wide">Puntaje</div>
            <div class="text-3xl font-bold text-blue-600">{{ score.toLocaleString() }}</div>
          </div>
          <div v-if="lastFusion.points > 0" class="px-4 py-2 rounded-lg animate-custom-pulse" 
               :class="lastFusion.colorBonus ? 'bg-yellow-100 border border-yellow-300' : 'bg-green-100 border border-green-300'">
            <div class="text-sm font-medium" 
                 :class="lastFusion.colorBonus ? 'text-yellow-700' : 'text-green-700'">
              +{{ lastFusion.points }} pts • {{ lastFusion.fusion }}
            </div>
            <div v-if="lastFusion.colorBonus" class="text-xs text-yellow-600 font-bold flex items-center">
              ⭐ BONUS MISMO COLOR ⭐
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500 uppercase tracking-wide">Nivel</div>
          <div class="text-3xl font-semibold text-gray-700">{{ Math.floor(score / 1000) + 1 }}</div>
        </div>
      </div>
    </div>

    <!-- Canvas del juego centrado -->
    <div class="transition-all duration-300 ease-in-out w-full md:w-auto">
      <canvas
        ref="gameCanvas"
        class="border border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer hover:border-gray-500 block max-w-full h-auto"
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
        <p class="text-yellow-600 text-xs mb-1 font-semibold">
          ⭐ BONUS: ¡Fusionar burbujas del mismo color da puntos extra! ⭐
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
  colorBonus: false,
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
    
    physicsEngine.onBubbleFusion = (valueA, valueB, sum, pointsEarned, colorBonus) => {
      const bonusText = colorBonus ? ' ¡MISMO COLOR!' : ''
      console.log(`¡Fusión exitosa! ${valueA} + ${valueB} = ${sum} (+${pointsEarned} pts)${bonusText}`)
      score.value = physicsEngine.scoreManager.getScore()
      
      // Mostrar animación de puntos ganados
      lastFusion.value = {
        points: pointsEarned,
        fusion: `${valueA}+${valueB}=${sum}`,
        colorBonus: colorBonus,
        timestamp: Date.now()
      }
      
      // Limpiar la animación después de 3 segundos
      if (fusionAnimationTimeout) {
        clearTimeout(fusionAnimationTimeout)
      }
      fusionAnimationTimeout = setTimeout(() => {
        lastFusion.value = { points: 0, fusion: '', colorBonus: false, timestamp: 0 }
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