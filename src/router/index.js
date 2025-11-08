import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: GameView
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
