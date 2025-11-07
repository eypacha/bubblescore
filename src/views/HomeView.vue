<template>
  <div class="min-h-screen bg-white flex items-center justify-center">
    <div class="text-center max-w-2xl mx-auto px-6">
      <!-- Logo y título -->
      <div class="mb-12">
        <h1 class="text-6xl md:text-7xl font-light text-gray-900 mb-6">
          BubbleScore
        </h1>
        <p class="text-xl text-gray-600 font-light">
          Combina burbujas numéricas con física realista
        </p>
      </div>

      <!-- Botón de juego -->
      <div class="mb-16">
        <router-link
          to="/game"
          class="inline-block bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg px-8 py-3 rounded-lg 
                 transition-colors duration-200"
        >
          Jugar
        </router-link>
      </div>

      <!-- Descripción minimalista -->
      <div class="text-center">
        <p class="text-gray-500 text-sm max-w-md mx-auto">
          Un juego de puzzle físico donde debes combinar burbujas numéricas para alcanzar sumas específicas.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vista minimalista sin lógica compleja
</script>

<style scoped>
/* Efectos sutiles */
h1 {
  letter-spacing: -0.025em;
}
</style>