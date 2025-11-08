<template>
  <div class="p-4 mb-4 w-full max-w-4xl md:p-4 md:flex-row md:items-center md:gap-0">
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
        <div class="text-xs text-gray-500 uppercase tracking-wide">Nivel</div>
        <div class="text-lg font-semibold text-gray-700">{{ Math.floor(score / 1000) + 1 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  score: {
    type: Number,
    required: true
  },
  lastFusion: {
    type: Object,
    required: true
  }
})
</script>