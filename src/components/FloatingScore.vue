<template>
  <div 
    v-if="visible"
    class="absolute pointer-events-none z-50 animate-float-up"
    :style="{ 
      left: (x / canvasWidth * 100) + '%', 
      top: (y / canvasHeight * 100) + '%',
      transform: 'translate(-50%, -50%)'
    }"
  >
    <div 
      class="px-3 py-1 rounded-lg shadow-lg font-bold text-sm whitespace-nowrap"
      :class="[
        isPerfectFusion ? 'bg-purple-600 text-white' :
        colorBonus ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
      ]"
    >
      <div class="text-center">
        <div class="">+{{ points }}</div>
        <div v-if="isPerfectFusion" class="text-sm font-bold">
          100
        </div>
        <div v-else-if="colorBonus" class="text-sm font-bold">
          COLOR
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  points: {
    type: Number,
    required: true
  },
  colorBonus: {
    type: Boolean,
    default: false
  },
  isPerfectFusion: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    required: true
  },
  y: {
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
  },
  duration: {
    type: Number,
    default: 2000
  }
})

const emit = defineEmits(['remove'])

const visible = ref(false)

onMounted(() => {
  visible.value = true
  
  setTimeout(() => {
    visible.value = false
    setTimeout(() => {
      emit('remove')
    }, 300) // Esperar a que termine la animación antes de remover
  }, props.duration)
})
</script>

<style scoped>
@keyframes float-up {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5) translateY(0px);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1) translateY(-10px);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8) translateY(-60px);
  }
}

.animate-float-up {
  animation: float-up 2s ease-out forwards;
}
</style>