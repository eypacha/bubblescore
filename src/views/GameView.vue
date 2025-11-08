<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <!-- Panel de puntaje - solo muestra el puntaje principal -->
    <div class="p-4 mb-4 w-full max-w-4xl">
      <div class="flex justify-between items-center flex-col gap-4 items-start md:flex-row md:gap-6 md:items-center">
        <div class="flex items-center gap-6">
          <div>
            <div class="text-sm text-gray-500 font-medium uppercase tracking-wide">Puntaje</div>
            <div class="text-3xl font-bold text-blue-600">{{ score.toLocaleString() }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Nivel</div>
          <div class="text-lg font-semibold text-gray-700">{{ Math.floor(score / 1000) + 1 }}</div>
        </div>
      </div>
    </div>

    <!-- Canvas del juego centrado -->
    <div class="transition-all duration-300 ease-in-out w-full md:w-auto relative">
      <!-- Canvas container con posición relativa -->
      <div class="relative inline-block">
        <canvas
          ref="gameCanvas"
          class="border border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer hover:border-gray-500 block max-w-full h-auto"
          :class="{ 'opacity-20': isGameOver }"
          :width="canvasWidth"
          :height="canvasHeight"
          @click="createBubble"
        ></canvas>

        <!-- Efectos de puntos flotantes dentro del canvas container -->
                <!-- Efectos de puntos flotantes dentro del canvas container -->
        <FloatingScore
          v-for="floatingScore in floatingScores"
          :key="floatingScore.id"
          :points="floatingScore.points"
          :fusion="floatingScore.fusion"
          :colorBonus="floatingScore.colorBonus"
          :isPerfectFusion="floatingScore.isPerfectFusion"
          :isBombExplosion="floatingScore.isBombExplosion"
          :x="floatingScore.x"
          :y="floatingScore.y"
          :canvasWidth="canvasWidth"
          :canvasHeight="canvasHeight"
          :duration="floatingScore.duration"
          @remove="removeFloatingScore(floatingScore.id)"
        />
      </div>

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
import FloatingScore from '../components/FloatingScore.vue'

const gameCanvas = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// Estado del puntaje
const score = ref(0)
const isGameOver = ref(false) // Cambiado a false para que inicie el juego normal
const floatingScores = ref([])

let physicsEngine = null
let animationId = null
let bubbleInterval = null
let nextFloatingId = 0

let bubbleSpawnInterval = 2600 // Empieza más lento

const createBubble = () => {
  if (physicsEngine && physicsEngine.bubbleFactory) {
    physicsEngine.bubbleFactory.createBubble()
  } 
}

const restartGame = () => {
  console.log('RestartGame llamado...')
  isGameOver.value = false
  score.value = 0
  floatingScores.value = []
  
  stopBubbleGeneration()
  
  if (physicsEngine) {
    physicsEngine.restart()
    if (physicsEngine.scoreManager) {
      physicsEngine.scoreManager.reset()
    }
  }
  
  console.log('Esperando 300ms antes de reiniciar generación de burbujas...')
  setTimeout(() => {
    startBubbleGeneration()
  }, 300)
}

const startBubbleGeneration = () => {
  console.log('StartBubbleGeneration llamado...')
  createBubble()

  // Asegurarse de limpiar cualquier intervalo previo
  if (bubbleInterval) {
    clearInterval(bubbleInterval)
  }

  bubbleInterval = setInterval(() => {
    createBubble()
  }, bubbleSpawnInterval)

  console.log('Generación automática de burbujas iniciada con intervalo:', bubbleSpawnInterval)
}
// Incrementa la velocidad de aparición de burbujas con cada nivel
function onLevelUp(newLevel) {
  // Reduce el intervalo un 8% por nivel, mínimo 600ms
  bubbleSpawnInterval = Math.max(600, Math.floor(bubbleSpawnInterval * 0.92));
  if (bubbleInterval) {
    clearInterval(bubbleInterval);
    bubbleInterval = setInterval(() => {
      createBubble();
    }, bubbleSpawnInterval);
    console.log('Nuevo intervalo de burbujas:', bubbleSpawnInterval);
  }
}

const stopBubbleGeneration = () => {
  if (bubbleInterval) {
    clearInterval(bubbleInterval)
    bubbleInterval = null
    console.log('Generación automática de burbujas detenida, intervalo limpiado')
  } else {
    console.log('No había intervalo activo para detener')
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
    physicsEngine.onLevelUp = onLevelUp;

    updateCanvasSize()

    physicsEngine.onBubbleFusion = (valueA, valueB, sum, pointsEarned, colorBonus, isPerfectFusion = false, fusionX, fusionY) => {
      const bonusText = colorBonus ? 'COLOR!' : ''
      const perfectText = isPerfectFusion ? '100!' : ''
      score.value = physicsEngine.scoreManager.getScore()
      
      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
      const margin = 30; 
      const clampedX = clamp(fusionX, margin, canvasWidth.value - margin);
      const clampedY = clamp(fusionY, margin, canvasHeight.value - margin);

      const floatingScore = {
        id: nextFloatingId++,
        points: pointsEarned,
        fusion: isPerfectFusion ? `${valueA}+${valueB}=💯` : `${valueA}+${valueB}=${sum}`,
        colorBonus: colorBonus,
        isPerfectFusion: isPerfectFusion,
        x: clampedX,
        y: clampedY,
        duration: isPerfectFusion ? 3000 : 2000
      }
      floatingScores.value.push(floatingScore)
    }
    
    physicsEngine.scoreManager.onScoreUpdate = (newScore, pointsAdded) => {
      score.value = physicsEngine.scoreManager.getScore()
    }
    
    physicsEngine.onGameOver = () => {
      isGameOver.value = true
      stopBubbleGeneration()
    }
    
    physicsEngine.onBombExploded = (bombX, bombY) => {
      const explosionEffect = {
        id: nextFloatingId++,
        points: 0,
        fusion: '💥 ¡BOMBA EXPLOTÓ! 💥',
        colorBonus: false,
        isPerfectFusion: false,
        isBombExplosion: true,
        x: bombX,
        y: bombY,
        duration: 3000
      }
      
  floatingScores.value.push(explosionEffect)
  // Penalización: restar 200 puntos al explotar bomba
  score.value = Math.max(0, score.value - 200)
    }
    
    gameLoop()
    
    setTimeout(() => {
      startBubbleGeneration()
    }, 500)
  }
}

const removeFloatingScore = (scoreId) => {
  const index = floatingScores.value.findIndex(fs => fs.id === scoreId)
  if (index !== -1) {
    floatingScores.value.splice(index, 1)
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
  if (physicsEngine) {
    physicsEngine.destroy()
  }
})
</script>