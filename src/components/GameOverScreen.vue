<template>
  <div v-show="isVisible" 
       class="absolute inset-0 bg-opacity-95 rounded-lg border border-gray-300 shadow-lg flex flex-col items-center justify-center p-6"
       :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
    
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

    <!-- Botón de reinicio -->
    <div class="flex flex-col gap-2 w-full max-w-xs">
      <button 
        @click="$emit('restart')"
        class="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm">
        Jugar de Nuevo
      </button>
      <div class="text-center mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        💡 Tip: Fusiona burbujas del mismo color para bonus
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isVisible: {
    type: Boolean,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  canvasWidth: {
    type: Number,
    required: true
  },
  canvasHeight: {
    type: Number,
    required: true
  }
})

defineEmits(['restart'])
</script>