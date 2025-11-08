<template>
  <div v-show="isVisible" 
       class="absolute inset-0 bg-opacity-95 rounded-lg border border-gray-300 shadow-lg flex flex-col items-center justify-center p-6"
       :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
    
    <!-- Title Game Over -->
    <div class="text-center mb-8">
      <div class="text-5xl mb-3">🎯</div>
      <h2 class="text-4xl font-bold text-gray-800 mb-2">Game Over</h2>
    </div>

    <!-- Statistics -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6 w-full max-w-xs">
      <div class="text-center space-y-3">
        <div>
          <div class="text-2xl font-bold text-blue-600">{{ score.toLocaleString() }}</div>
          <div class="text-xs text-gray-500 uppercase tracking-wide">Score:</div>
        </div>
        <div class="border-t pt-3">
          <div class="text-lg font-semibold text-gray-700">Level {{ Math.floor(score / LEVEL_UP_SCORE) + 1 }}</div>
        </div>
      </div>
    </div>

    <!-- Restart button -->
    <div class="flex flex-col gap-2 w-full max-w-xs">
      <button 
        @click="$emit('restart')"
        class="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm">
        Play Again
      </button>
      <div class="text-center mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        💡 Tip: {{ randomTip }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { LEVEL_UP_SCORE } from '../game/constants.js'

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

const tips = [
  'Fuse bubbles of the same color for bonus.',
  'Try to plan your moves ahead for bigger combos.',
  'Bombs clear space but subtract points!',
  'Bombs can clear space, use them wisely!',
  'Higher levels mean faster bubbles. Stay sharp!',
  'Multiples of 10 are the key to fusion.',
  'Don’t let bubbles reach the danger line!',
  'Perfect fusions give extra points!',
  'Chain reactions can boost your score quickly.'
]

const randomTip = tips[Math.floor(Math.random() * tips.length)]
</script>