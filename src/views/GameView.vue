<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <!-- Panel de puntaje -->
    <ScorePanel :score="score" :lastFusion="lastFusion" />

    <!-- Canvas del juego centrado -->
    <div class="transition-all duration-300 ease-in-out w-full md:w-auto relative">
      <canvas
        ref="gameCanvas"
        class="border border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer hover:border-gray-500 block max-w-full h-auto"
        :class="{ 'opacity-20': isGameOver }"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="createBubble"
      ></canvas>

      <!-- Game Over Screen -->
      <GameOverScreen 
        :isVisible="isGameOver"
        :score="score"
        :canvasWidth="canvasWidth"
        :canvasHeight="canvasHeight"
        @restart="restartGame"
      />
      
      <!-- Instrucciones del juego -->
      <GameInstructions/>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { GamePhysics } from '../game/physics.js'
import ScorePanel from '../components/ScorePanel.vue'
import GameOverScreen from '../components/GameOverScreen.vue'
import GameInstructions from '../components/GameInstructions.vue'

const gameCanvas = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// Estado del puntaje
const score = ref(0)
const isGameOver = ref(false) // Cambiado a false para que inicie el juego normal
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

const restartGame = () => {
  isGameOver.value = false
  score.value = 0
  lastFusion.value = { points: 0, fusion: '', colorBonus: false, timestamp: 0 }
  
  if (fusionAnimationTimeout) {
    clearTimeout(fusionAnimationTimeout)
    fusionAnimationTimeout = null
  }
  
  stopBubbleGeneration()
  
  if (physicsEngine) {
    physicsEngine.restart()
    if (physicsEngine.scoreManager) {
      physicsEngine.scoreManager.reset()
    }
  }
  
  setTimeout(() => {
    startBubbleGeneration()
  }, 300)
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
      
      lastFusion.value = {
        points: pointsEarned,
        fusion: `${valueA}+${valueB}=${sum}`,
        colorBonus: colorBonus,
        timestamp: Date.now()
      }
      
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
      isGameOver.value = true
      stopBubbleGeneration()
    }
    
    gameLoop()
    
    setTimeout(() => {
      startBubbleGeneration()
    }, 500)
  }
}

const updateCanvasSize = () => {
  const maxWidth = Math.min(window.innerWidth - 40, 900)
  const maxHeight = Math.min(window.innerHeight - 40, 600)
  
  canvasWidth.value = maxWidth
  canvasHeight.value = maxHeight
  
  if (physicsEngine) {
    physicsEngine.resize(maxWidth, maxHeight)
  }
}

onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
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
})
</script>