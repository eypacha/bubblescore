export class ScoreManager {
  constructor() {
    this.score = 0
    this.multiplierBonus = 10
    this.onScoreUpdate = null
  }

  addScore(bubbleValueA, bubbleValueB, fusionSum) {
    const baseScore = fusionSum * this.multiplierBonus
    let bonus = 0
    
    if (fusionSum >= 50) {
      bonus = Math.floor(fusionSum / 10) * 25
    }
    
    if (fusionSum === 100) {
      bonus += 500
    }
    
    const totalPoints = baseScore + bonus
    this.score += totalPoints
    
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, totalPoints, fusionSum)
    }
    
    return totalPoints
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