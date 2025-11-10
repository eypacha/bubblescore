<template>
  <div v-show="isVisible" 
       class="absolute inset-0  bg-[#fff9] rounded-lg border border-gray-300 shadow-lg flex flex-col items-center justify-center p-6"
       :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
    
    <!-- Title Game Over -->
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-800 mb-2">Bubble Score</h2>
      <p class="text-gray-600 text-sm mb-2">
        Click on two bubbles whose sum is a multiple of 10 to fuse them.
      </p>
    </div>

    <!-- Restart button -->
    <div class="flex flex-col gap-2 w-full max-w-xs">
      <button 
        @click="$emit('play')"
        class="bg-blue-600 text-white font-medium py-2 px-4 rounded-[30px] transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
        Play
      </button>
    </div>
  </div>
</template>

<script setup>

defineProps({
  isVisible: {
    type: Boolean,
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

defineEmits(['play'])
</script>