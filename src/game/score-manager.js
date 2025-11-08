export class ScoreManager {
  subtractPoints(points) {
    this.score = Math.max(0, this.score - points);
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, -points, 0);
    }
  }
  constructor() {
    this.score = 0
    this.multiplierBonus = 10
    this.onScoreUpdate = null
  }

  addScore(bubbleValueA, bubbleValueB, fusionSum, bubbleA = null, bubbleB = null) {
    const baseScore = fusionSum * this.multiplierBonus
    let bonus = 0
    
    // Bonus por fusión de alto valor
    if (fusionSum >= 50) {
      bonus = Math.floor(fusionSum / 10) * 25
    }
    
    // Bonus especial por fusión de 100
    if (fusionSum === 100) {
      bonus += 500
    }
    
    // Bonus por mismo color exacto
    let colorBonus = 0
    if (bubbleA && bubbleB && this.isSameColor(bubbleA.color, bubbleB.color)) {
      colorBonus = fusionSum * 20 // 2x el bonus normal
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