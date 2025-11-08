import {
  MULTIPLIER_BONUS,
  HIGH_VALUE_FUSION_BONUS,
  HIGH_VALUE_FUSION_THRESHOLD,
  PERFECT_FUSION_BONUS,
  COLOR_BONUS_MULTIPLIER
} from './constants.js'

export class ScoreManager {
  subtractPoints(points) {
    this.score = Math.max(0, this.score - points);
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, -points, 0);
    }
  }
  constructor() {
    this.score = 0
    this.multiplierBonus = MULTIPLIER_BONUS
    this.onScoreUpdate = null
  }

  addScore(fusionSum, bubbleA = null, bubbleB = null) {
    const baseScore = fusionSum * this.multiplierBonus
    let bonus = 0
    
    if (fusionSum >= HIGH_VALUE_FUSION_THRESHOLD) {
      bonus = Math.floor(fusionSum / 10) * HIGH_VALUE_FUSION_BONUS
    }
    
    if (fusionSum === 100) {
      bonus += PERFECT_FUSION_BONUS
    }
    
    let colorBonus = 0
    if (bubbleA && bubbleB && this.isSameColor(bubbleA.color, bubbleB.color)) {
      colorBonus = fusionSum * COLOR_BONUS_MULTIPLIER // 2x el bonus normal
      bonus += colorBonus
    }
    
    const totalPoints = baseScore + bonus
    this.score += totalPoints
    
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, totalPoints, fusionSum, colorBonus > 0)
    }
    
    return { totalPoints, colorBonus }
  }

  isSameColor(colorA, colorB) {
    if (!colorA || !colorB) return false
    
    // Comparar tanto el fill como el stroke para asegurar que es exactamente el mismo color
    return colorA.fill === colorB.fill && colorA.stroke === colorB.stroke
  }

  getScore() {
    return this.score
  }

  reset() {
    this.score = 0
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, 0, 0)
    }
  }
}