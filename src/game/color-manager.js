import mixbox from 'mixbox'

export class ColorManager {
  constructor() {
    this.primaryColors = [
      { fill: '#FF2702', stroke: '#CC1F02', name: 'red' },
      { fill: '#FEEC00', stroke: '#CBBC00', name: 'yellow' },
      { fill: '#002185', stroke: '#001A6B', name: 'blue' }
    ]
  }

  getRandomColor() {
    const colorIndex = Math.floor(Math.random() * this.primaryColors.length)
    return this.primaryColors[colorIndex]
  }

  mixColors(colorA, colorB) {
    const hexToRgbString = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (result) {
        const r = parseInt(result[1], 16)
        const g = parseInt(result[2], 16)
        const b = parseInt(result[3], 16)
        return `rgb(${r}, ${g}, ${b})`
      }
      return null
    }

    const mixboxResultToHex = (mixboxResult) => {
      if (typeof mixboxResult === 'string' && mixboxResult.startsWith('rgb(')) {
        const match = mixboxResult.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
          const r = parseInt(match[1])
          const g = parseInt(match[2])
          const b = parseInt(match[3])
          return this.rgbToHex(r, g, b)
        }
      }
      
      if (Array.isArray(mixboxResult) && mixboxResult.length >= 3) {
        const r = Math.round(mixboxResult[0])
        const g = Math.round(mixboxResult[1]) 
        const b = Math.round(mixboxResult[2])
        return this.rgbToHex(r, g, b)
      }
      
      return '#000000'
    }

    const rgbA = hexToRgbString(colorA.fill)
    const rgbB = hexToRgbString(colorB.fill)
    const strokeA = hexToRgbString(colorA.stroke)
    const strokeB = hexToRgbString(colorB.stroke)
    
    if (!rgbA || !rgbB || !strokeA || !strokeB) {
      console.error('Error convirtiendo colores:', colorA, colorB)
      return { fill: '#6B7280', stroke: '#4B5563', name: 'gray' }
    }
    
    const mixedRgbString = mixbox.lerp(rgbA, rgbB, 0.5)
    const mixedStrokeString = mixbox.lerp(strokeA, strokeB, 0.5)
    
    const mixedFill = mixboxResultToHex(mixedRgbString)
    const mixedStrokeHex = mixboxResultToHex(mixedStrokeString)
    
    const mixedName = `${colorA.name}+${colorB.name}`
    
    const result = {
      fill: mixedFill,
      stroke: mixedStrokeHex,
      name: mixedName
    }
    
    return result
  }

  rgbToHex(r, g, b) {
    const componentToHex = (c) => {
      const hex = Math.round(c).toString(16)
      return hex.length == 1 ? "0" + hex : hex
    }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b)
  }

}