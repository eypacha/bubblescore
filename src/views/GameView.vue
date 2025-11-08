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
    <div class="transition-all duration-300 ease-in-out w-full md:w-auto relative">
      <canvas
        ref="gameCanvas"
        class="border border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer hover:border-gray-500 block max-w-full h-auto"
        :class="{ 'opacity-20': isGameOver }"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="createBubble"
      ></canvas>

      <!-- Game Over Screen - Mismo tamaño que el canvas -->
      <div v-show="isGameOver" 
           class="absolute inset-0 bg-white bg-opacity-95 rounded-lg border border-gray-300 shadow-lg flex flex-col items-center justify-center p-6"
           :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">>
        
        <!-- Título Game Over -->
        <div class="text-center mb-8">
          <div class="text-5xl mb-3">🎯</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Game Over</h2>
          <p class="text-gray-600 text-sm">Tu partida ha terminado</p>
        </div>

        <!-- Estadísticas -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 w-full max-w-xs">
          <div class="text-center space-y-3">
            <div>
              <div class="text-2xl font-bold text-blue-600">{{ score.toLocaleString() }}</div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">Puntaje Final</div>
            </div>
            <div class="border-t pt-3">
              <div class="text-lg font-semibold text-gray-700">Nivel {{ Math.floor(score / 1000) + 1 }}</div>
              <div class="text-xs text-gray-500">Alcanzado</div>
            </div>
          </div>
        </div>

        <!-- Mensaje -->
        <div class="text-center mb-6">
          <p class="text-gray-600 text-sm max-w-xs leading-relaxed">
            <template v-if="score < 1000">
              ¡Buen intento! Practica más para mejorar.
            </template>
            <template v-else-if="score < 5000">
              ¡Excelente progreso! Dominas las fusiones.
            </template>
            <template v-else-if="score < 10000">
              ¡Increíble! Eres un maestro.
            </template>
            <template v-else>
              ¡LEGENDARIO! Maestría absoluta.
            </template>
          </p>
        </div>

        <!-- Botón de reinicio -->
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <button 
            @click="restartGame"
            class="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm">
            Jugar de Nuevo
          </button>
          <div class="text-center mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
            💡 Tip: Fusiona burbujas del mismo color para bonus
          </div>
        </div>
      </div>
      
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
        <!-- Botón temporal para testing -->
        <button @click="isGameOver = true; score = 1500" class="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded">
          Test Game Over
        </button>
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
  // Resetear estados de Vue
  isGameOver.value = false
  score.value = 0
  lastFusion.value = { points: 0, fusion: '', colorBonus: false, timestamp: 0 }
  
  // Limpiar timeouts
  if (fusionAnimationTimeout) {
    clearTimeout(fusionAnimationTimeout)
    fusionAnimationTimeout = null
  }
  
  // Detener generación actual de burbujas
  stopBubbleGeneration()
  
  // Reiniciar el motor de física
  if (physicsEngine) {
    physicsEngine.isGameOver = false
    physicsEngine.bubbles = []
    if (physicsEngine.scoreManager) {
      physicsEngine.scoreManager.reset()
    }
    
    // Limpiar el canvas
    const ctx = physicsEngine.ctx
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    }
  }
  
  // Reiniciar generación de burbujas después de un pequeño delay
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
      isGameOver.value = true
      stopBubbleGeneration()
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