import Matter from 'matter-js'
import {
    LEVEL_UP_SCORE,
    TIME_IN_DANGER_TO_GAME_OVER,
    BUBBLE_TIMER,
    EXPLOSION_DURATION,
    EXPLOSION_RADIUS
} from './constants.js'
import { AudioManager } from './audio-manager.js'
import { ColorManager } from './color-manager.js'
import { BubbleFactory } from './bubble-factory.js'
import { ScoreManager } from './score-manager.js'

export class GamePhysics {
    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        this.isGameOver = false
        this.dangerLineY = null
        this.onGameOver = null
        this.selectedBubbles = []
        this.lastClickPosition = null

        this.initializePhysicsEngine()
        this.initializeAudio()
        this.initializeColors()
        this.initializeBubbleFactory()
        this.initializeScore()
        this.setupClickEvents()
        this.createWalls()
        this.startEngine()

        this.updateDangerLine()
    }

    initializePhysicsEngine() {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.engine.world.gravity.y = 0.8
        this.engine.world.gravity.x = 0

        this.render = Matter.Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: this.canvas.width,
                height: this.canvas.height,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: false,
                showVelocity: false
            }
        })
    }

    initializeAudio() {
        this.audioManager = new AudioManager()
    }

    initializeColors() {
        this.colorManager = new ColorManager()
    }

    initializeBubbleFactory() {
        this.bubbleFactory = new BubbleFactory(this.world, this.canvas, this.colorManager)
    }

    initializeScore() {
        this.scoreManager = new ScoreManager()
    }

    startEngine() {
        Matter.Render.run(this.render)
        this.runner = Matter.Runner.create()
        Matter.Runner.run(this.runner, this.engine)
        this.setupCollisionEvents()
    }

    setupCollisionEvents() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair

                if (bodyA.isBubble && !bodyA.hasCollided) {
                    bodyA.hasCollided = true
                    this.audioManager.playDropSound()
                } else if (bodyB.isBubble && !bodyB.hasCollided) {
                    bodyB.hasCollided = true
                    this.audioManager.playDropSound()
                }
            })
        })
    }

    updateDangerLine() {
        this.dangerLineY = this.canvas.height * 0.1
    }

    checkGameOver() {
        if (this.isGameOver) return false

        const currentTime = Date.now()
        const bodies = Matter.Composite.allBodies(this.world)
        const bubbles = bodies.filter(body => body.isBubble)

        bubbles.forEach(bubble => {
            const bubbleTop = bubble.position.y - bubble.circleRadius
            const dangerZone = this.dangerLineY

            if (bubbleTop <= dangerZone) {
                if (!bubble.dangerZoneStartTime) {
                    bubble.dangerZoneStartTime = currentTime
                }

                const timeInDanger = currentTime - bubble.dangerZoneStartTime
                if (timeInDanger > TIME_IN_DANGER_TO_GAME_OVER) {
                    this.triggerGameOver()
                    return true
                }
            } else {
                bubble.dangerZoneStartTime = null
            }
        })

        return false
    }

    triggerGameOver() {
        this.isGameOver = true

        if (this.runner) {
            Matter.Runner.stop(this.runner)
        }

        if (this.onGameOver) {
            this.onGameOver()
        }
    }

    restart() {
        this.isGameOver = false
        this.selectedBubble = null
        this.selectedBubbles = []
        this.lastClickPosition = null

        const bodies = Matter.Composite.allBodies(this.world)
        const bubbles = bodies.filter(body => body.isBubble)
        Matter.Composite.remove(this.world, bubbles)

        if (this.bubbleFactory) {
            this.bubbleFactory.reset()
        }

        Matter.Runner.stop(this.runner)
        this.runner = Matter.Runner.create()
        Matter.Runner.run(this.runner, this.engine)

        this.setupCollisionEvents()

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    setupClickEvents() {
        this.canvas.addEventListener('click', this.onBubbleClick.bind(this))
    }

    onBubbleClick(event) {
        if (this.isGameOver) return

        const mousePos = this.getMousePosition(event)
        this.lastClickPosition = { x: mousePos.x, y: mousePos.y }
        const clickedBubble = this.findBodyAtPosition(mousePos.x, mousePos.y)
        if (clickedBubble && clickedBubble.isBubble) {
            if (clickedBubble.isBomb) {
                this.decrementBombTimers();
                this.clearSelection();
            } else if (clickedBubble.isClock) {
                // Activar la mecánica de pausa directamente
                this.activateClockPause(clickedBubble);
                this.clearSelection();
            } else {
                this.selectBubble(clickedBubble);
            }
        }
    }

    selectBubble(bubble) {
        if (this.selectedBubbles.includes(bubble)) {
            this.deselectBubble(bubble)
            return
        }

        if (this.selectedBubbles.length < 2) {
            this.selectedBubbles.push(bubble)
            bubble.isSelected = true

            if (this.selectedBubbles.length === 2) {
                this.attemptFusion()
            }
        }
    }

    activateClockPause(clockBubble) {
        clockBubble.clockTimer = BUBBLE_TIMER / 1000;
        this.isClockPauseActive = true;

        const bodies = Matter.Composite.allBodies(this.world);
        bodies.forEach(body => {
            if (body.isBubble && !body.isBomb && !body.isClock) {
                body.isFrozen = true;
                body.savedVelocity = { x: body.velocity.x, y: body.velocity.y };
                Matter.Body.setVelocity(body, { x: 0, y: 0 });
            }
        });

        if (typeof this.onPauseGame === 'function') {
            this.onPauseGame(BUBBLE_TIMER)
        }
        if (this.audioManager && this.audioManager.playClockSound) {
            this.audioManager.playClockSound()
        }
        let timer = BUBBLE_TIMER / 1000;
        const countdownInterval = setInterval(() => {
            timer--;
            clockBubble.clockTimer = timer;
            if (timer <= 0) {
                clearInterval(countdownInterval);
                Matter.World.remove(this.world, [clockBubble]);
                this.isClockPauseActive = false;
                // Restaurar movimiento de burbujas
                bodies.forEach(body => {
                    if (body.isBubble && body.isFrozen) {
                        Matter.Body.setVelocity(body, body.savedVelocity || { x: 0, y: 0 });
                        body.isFrozen = false;
                        body.savedVelocity = undefined;
                    }
                });
                if (typeof this.onBubbleFusion === 'function') {
                    this.onBubbleFusion('⏰', null, 'TIME', 0, false, false, clockBubble.position.x, clockBubble.position.y);
                }
            }
        }, 1000);
    }

    deselectBubble(bubble) {
        const index = this.selectedBubbles.indexOf(bubble)
        if (index !== -1) {
            this.selectedBubbles.splice(index, 1)
            bubble.isSelected = false
        }
    }

    clearSelection() {
        this.selectedBubbles.forEach(bubble => {
            bubble.isSelected = false
        })
        this.selectedBubbles = []
        this.lastClickPosition = null
    }

    attemptFusion() {
        const [bubbleA, bubbleB] = this.selectedBubbles

        if (bubbleA.isBomb || bubbleB.isBomb) {
            this.clearSelection()
            return
        }

        if (bubbleA.isClock && bubbleB.isClock) {
            bubbleA.clockTimer = BUBBLE_TIMER / 1000;
            bubbleB.clockTimer = BUBBLE_TIMER / 1000;
            this.isClockPauseActive = true;

            const bodies = Matter.Composite.allBodies(this.world);
            bodies.forEach(body => {
                if (body.isBubble && !body.isBomb && !body.isClock) {
                    body.isFrozen = true;
                    body.savedVelocity = { x: body.velocity.x, y: body.velocity.y };
                    Matter.Body.setVelocity(body, { x: 0, y: 0 });
                }
            });

            if (typeof this.onPauseGame === 'function') {
                this.onPauseGame(BUBBLE_TIMER)
            }
            if (this.audioManager && this.audioManager.playClockSound) {
                this.audioManager.playClockSound()
            }
            let timer = BUBBLE_TIMER / 1000;
            const countdownInterval = setInterval(() => {
                timer--;
                bubbleA.clockTimer = timer;
                bubbleB.clockTimer = timer;
                if (timer <= 0) {
                    clearInterval(countdownInterval);
                    Matter.World.remove(this.world, [bubbleA, bubbleB]);
                    this.isClockPauseActive = false;
                    // Restaurar movimiento de burbujas
                    bodies.forEach(body => {
                        if (body.isBubble && body.isFrozen) {
                            Matter.Body.setVelocity(body, body.savedVelocity || { x: 0, y: 0 });
                            body.isFrozen = false;
                            body.savedVelocity = undefined;
                        }
                    });
                    if (typeof this.onBubbleFusion === 'function') {
                        this.onBubbleFusion('⏰', '⏰', 'TIME', 0, false, false, bubbleA.position.x, bubbleA.position.y);
                    }
                }
            }, 1000);
            this.clearSelection();
            return;
        }

        const sum = bubbleA.value + bubbleB.value

        if (sum % 10 === 0 && sum >= 10 && sum <= 100) {
            this.audioManager.playFusionSound()

            const fusionX = this.lastClickPosition ? this.lastClickPosition.x : (bubbleA.position.x + bubbleB.position.x) / 2
            const fusionY = this.lastClickPosition ? this.lastClickPosition.y : (bubbleA.position.y + bubbleB.position.y) / 2

            const scoreResult = this.scoreManager.addScore(sum, bubbleA, bubbleB)

            if (sum === 100) {
                Matter.World.remove(this.world, [bubbleA, bubbleB])
                this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum, scoreResult.totalPoints, scoreResult.colorBonus, true, fusionX, fusionY)
            } else {
                this.createFusedBubble(fusionX, fusionY, sum, bubbleA.color, bubbleB.color)
                Matter.World.remove(this.world, [bubbleA, bubbleB])
                this.onBubbleFusion?.(bubbleA.value, bubbleB.value, sum, scoreResult.totalPoints, scoreResult.colorBonus, false, fusionX, fusionY)
            }

            this.clearSelection()
        } else {
            this.clearSelection()
        }
    }

    createFusedBubble(x, y, value, colorA, colorB) {
        const baseRadius = 30;
        const fusionLevel = value / 10;
        const radius = Math.min(baseRadius + (fusionLevel * 5), 65);

        const fusedColor = this.colorManager.mixColors(colorA, colorB);

        const currentScore = this.scoreManager.getScore();
        const newLevel = Math.floor(currentScore / LEVEL_UP_SCORE) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            if (typeof this.onLevelUp === 'function') {
                this.onLevelUp(this.level);
            }
        }

        const fusedBubble = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.7,
            friction: 0.3,
            frictionAir: 0.01,
            render: {
                fillStyle: fusedColor.fill,
                strokeStyle: fusedColor.stroke,
                lineWidth: Math.min(2 + Math.floor(fusionLevel / 2), 6)
            },
            isBubble: true,
            isFused: true,
            hasCollided: true,
            fusionLevel: fusionLevel,
            value: value,
            color: fusedColor
        });

        Matter.World.add(this.world, fusedBubble);
        return fusedBubble;
    }

    decrementBombTimers() {
        const bodies = Matter.Composite.allBodies(this.world)
        const bombs = bodies.filter(body => body.isBomb)

        bombs.forEach(bomb => {
            bomb.bombTimer--
            if (this.audioManager && this.audioManager.playTickingSound) {
                this.audioManager.playTickingSound();
            }
            if (bomb.bombTimer <= 0) {
                this.explodeBomb(bomb)
            }
        })
    }

    explodeBomb(bomb) {
        if (this.audioManager && this.audioManager.playBombSound) {
            this.audioManager.playBombSound()
        }
        this.scoreManager.subtractPoints(1000);
        this.createExplosionEffect(bomb)
    }

    createExplosionEffect(bomb) {
        bomb.isExploding = true
        bomb.originalRadius = bomb.circleRadius
        bomb.explosionStartTime = Date.now()
        bomb.explosionDuration = EXPLOSION_DURATION
        bomb.maxExplosionRadius = bomb.originalRadius * EXPLOSION_RADIUS
        bomb.render.fillStyle = '#ff6600'
        bomb.render.strokeStyle = '#ff0000'
        bomb.render.lineWidth = 5

        this.updateExplosion(bomb)
    }

    updateExplosion(bomb) {
        if (!bomb.isExploding) return

        const currentTime = Date.now()
        const elapsed = currentTime - bomb.explosionStartTime
        const progress = Math.min(elapsed / bomb.explosionDuration, 1)

        const explosiveProgress = Math.pow(progress, 0.2)
        const targetRadius = bomb.originalRadius + (bomb.maxExplosionRadius - bomb.originalRadius) * explosiveProgress
        const currentRadius = bomb.circleRadius

        if (Math.abs(targetRadius - currentRadius) > 0.3) {
            const scaleFactor = targetRadius / currentRadius
            Matter.Body.scale(bomb, scaleFactor, scaleFactor)
        }

        // Desaparecer burbujas que colisionan con la bomba mientras crece
        const bodies = Matter.Composite.allBodies(this.world)
        const bubbles = bodies.filter(body => body.isBubble && !body.isBomb && !body.isExploding)
        bubbles.forEach(bubble => {
            const dx = bubble.position.x - bomb.position.x
            const dy = bubble.position.y - bomb.position.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < bomb.circleRadius) {
                Matter.World.remove(this.world, bubble)
            }
        })

        this.applyExplosionForce(bomb, targetRadius, progress)

        if (progress >= 1) {
            this.finishExplosion(bomb)
        }
    }

    applyExplosionForce(bomb, explosionRadius, progress = 1) {
        const bodies = Matter.Composite.allBodies(this.world)
        const bubbles = bodies.filter(body => body.isBubble && !body.isExploding && body !== bomb)

        bubbles.forEach(bubble => {
            const dx = bubble.position.x - bomb.position.x
            const dy = bubble.position.y - bomb.position.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < explosionRadius && distance > 0) {
                const forceIntensity = (explosionRadius - distance) / explosionRadius
                const progressMultiplier = Math.max(0.3, 1 - progress * 0.5)
                const baseForce = 0.05 * forceIntensity * progressMultiplier

                const forceX = (dx / distance) * baseForce
                const forceY = (dy / distance) * baseForce

                Matter.Body.applyForce(bubble, bubble.position, { x: forceX, y: forceY })
            }
        })
    }

    finishExplosion(bomb) {
        Matter.World.remove(this.world, bomb)
    }

    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        }
    }

    findBodyAtPosition(x, y) {
        const bodies = Matter.Composite.allBodies(this.world)
        for (let body of bodies) {
            if (body.isBubble && Matter.Bounds.contains(body.bounds, { x, y })) {
                const dx = x - body.position.x
                const dy = y - body.position.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance <= body.circleRadius) {
                    return body
                }
            }
        }
        return null
    }

    createWalls() {
        const { width, height } = this.canvas
        const wallThickness = 50

        const walls = [
            Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
                isStatic: true,
                render: { visible: false }
            }),
            Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
                isStatic: true,
                render: { visible: false }
            }),
            Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
                isStatic: true,
                render: { visible: false }
            })
        ]

        Matter.World.add(this.world, walls)
    }

    customRender() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.drawDynamicDangerLine()

        const bodies = Matter.Composite.allBodies(this.world)

        bodies.forEach(body => {
            if (body.isBubble && !body.isBomb && !body.isClock) {
                this.drawBubble(body)
            }
        })

        bodies.forEach(body => {
            if (body.isBubble && body.isClock) {
                this.drawBubble(body)
            }
        })

        bodies.forEach(body => {
            if (body.isBubble && body.isBomb) {
                this.drawBubble(body)
            }
        })

        this.updateAllExplosions()
    }

    updateAllExplosions() {
        const bodies = Matter.Composite.allBodies(this.world)
        const explodingBombs = bodies.filter(body => body.isExploding)

        explodingBombs.forEach(bomb => {
            this.updateExplosion(bomb)
        })
    }

    drawDynamicDangerLine() {
        if (!this.dangerLineY || !this.ctx) return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.dangerLineY);
        this.ctx.lineTo(this.canvas.width, this.dangerLineY);
        this.ctx.strokeStyle = 'rgba(255,0,0,0.7)';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([12, 8]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    drawBubble(body) {
        const pos = body.position
        const radius = body.circleRadius
        const fusionLevel = body.fusionLevel || 0
        const color = body.color || { fill: '#3B82F6', stroke: '#1E40AF' }
        const isSelected = body.isSelected || false
        const isBomb = body.isBomb || false
        const isExploding = body.isExploding || false

        this.ctx.save()
        this.ctx.translate(pos.x, pos.y)
        if (!body.isClock) {
            this.ctx.rotate(body.angle)
        }

        if (isBomb && !isExploding) {
            this.ctx.globalAlpha = 1

            if (isSelected) {
                this.ctx.strokeStyle = '#ffff00'
                this.ctx.lineWidth = 6
                this.ctx.beginPath()
                this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
                this.ctx.stroke()
            }

            const emojiSize = radius * 2.4
            this.ctx.font = `${emojiSize}px sans-serif`
            this.ctx.textAlign = 'center'
            this.ctx.textBaseline = 'middle'
            this.ctx.fillStyle = 'black'
            this.ctx.fillText('💣', 0, 0)

            this.ctx.fillStyle = '#ffffff'
            this.ctx.strokeStyle = '#000000'
            this.ctx.lineWidth = 2
            const timerFontSize = radius * 1
            this.ctx.font = `bold ${timerFontSize}px sans-serif`
            const timerY = 0
            this.ctx.strokeText(body.bombTimer.toString(), 0, timerY)
            this.ctx.fillText(body.bombTimer.toString(), 0, timerY)

        } else if (body.isClock) {
            this.ctx.globalAlpha = 1
            const emojiSize = radius * 3
            this.ctx.font = `${emojiSize}px sans-serif`
            this.ctx.textAlign = 'center'
            this.ctx.textBaseline = 'middle'
            this.ctx.fillStyle = 'black'
            this.ctx.fillText('⏰', 0, 0)

            this.ctx.fillStyle = (body.isSelected || this.isClockPauseActive) ? 'yellow' : '#ffffff'
            this.ctx.strokeStyle = '#000000'
            this.ctx.lineWidth = 2
            const timerFontSize = radius * 1.1
            this.ctx.font = `bold ${timerFontSize}px sans-serif`
            const timerY = -radius * 1.1
            const timerValue = body.clockTimer !== undefined ? body.clockTimer.toString() : ''
            this.ctx.strokeText(timerValue, 0, timerY)
            this.ctx.fillText(timerValue, 0, timerY)

        } else if (isExploding) {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
            gradient.addColorStop(0, '#ffff00')
            gradient.addColorStop(0.5, '#ff6600')
            gradient.addColorStop(1, '#ff0000')

            this.ctx.fillStyle = gradient
            this.ctx.strokeStyle = '#ffffff'
            this.ctx.lineWidth = 8

            const pulseIntensity = Math.sin(Date.now() * 0.02) * 0.2 + 1
            this.ctx.globalAlpha = 0.8 + pulseIntensity * 0.2

            this.ctx.beginPath()
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
            this.ctx.fill()
            this.ctx.stroke()

            this.ctx.fillStyle = '#ffffff'
            this.ctx.font = 'bold 20px sans-serif'
            this.ctx.textAlign = 'center'
            this.ctx.textBaseline = 'middle'
            this.ctx.strokeStyle = '#000000'
            this.ctx.lineWidth = 4
            this.ctx.globalAlpha = 1
            this.ctx.strokeText('BOOM!', 0, 0)
            this.ctx.fillText('BOOM!', 0, 0)

        } else {
            this.ctx.fillStyle = color.fill
            this.ctx.strokeStyle = color.stroke
            this.ctx.lineWidth = isSelected ? 6 : 2
            this.ctx.globalAlpha = 1

            this.ctx.beginPath()
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2)
            this.ctx.fill()
            this.ctx.stroke()

            this.ctx.fillStyle = 'white'
            const fontSize = Math.min(20 + fusionLevel * 3, 40)
            this.ctx.font = `bold ${fontSize}px sans-serif`
            this.ctx.textAlign = 'center'
            this.ctx.textBaseline = 'middle'
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
            this.ctx.lineWidth = Math.min(4 + fusionLevel, 8)
            this.ctx.globalAlpha = 1
            this.ctx.strokeText(body.value.toString(), 0, 0)
            this.ctx.fillText(body.value.toString(), 0, 0)

            if (body.value === 6 || body.value === 9) {
                const underlineY = fontSize * 0.5
                const underlineWidth = fontSize * 0.6

                this.ctx.beginPath()
                this.ctx.moveTo(-underlineWidth / 2, underlineY)
                this.ctx.lineTo(underlineWidth / 2, underlineY)
                this.ctx.strokeStyle = 'white'
                this.ctx.lineWidth = Math.max(2, fontSize * 0.08)
                this.ctx.stroke()
            }
        }

        this.ctx.restore()
    }

    resize(width, height) {
        this.canvas.width = width
        this.canvas.height = height
        this.render.options.width = width
        this.render.options.height = height

        this.updateDangerLine()

        const bodies = Matter.Composite.allBodies(this.world)
        const walls = bodies.filter(body => body.isStatic)
        Matter.World.remove(this.world, walls)
        this.createWalls()
    }

    destroy() {
        this.canvas.removeEventListener('click', this.onBubbleClick.bind(this))

        Matter.Render.stop(this.render)
        Matter.Runner.stop(this.runner)
        Matter.Engine.clear(this.engine)

        if (this.audioManager) {
            this.audioManager.destroy()
        }
    }
}