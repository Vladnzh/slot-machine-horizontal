import {Assets, Container, Graphics, Sprite, Texture, Ticker, Point} from 'pixi.js'

export class HorizontalSlotMachine extends Container {
    public wheelWidth: number
    public wheelHeight: number
    public elementWidth: number = 150
    protected elementHeight: number = 150
    protected maskWidth: number
    protected maskHeight: number

    public elementAmount: number = 5
    protected arrowSlotIndex: number = 2
    protected spinningTime: number = 5000
    protected winningIndex: number = 3
    protected customWinningTexture: Texture | null = null
    protected backOutEffect: number = 0.5
    protected verticalReduction: number = 0.1
    protected skewFactor: number = 0
    protected rotationSpeed: number = 1
    protected acceleration: number = 1
    protected slotTextureUrls: string[]
    protected wheel: { container: Container; elements: Sprite[]; position: number } | null
    protected tweening: any[]
    protected running: boolean
    protected slotTextures: Texture[]
    protected wheelSequence: Texture[]
    protected elementSpacing: number = 0

    protected spinDirection: number = 1
    protected cylinderCurvature: number = 1
    protected edgeNarrowing: number = 0
    protected wheelScale: Point = new Point(1, 1)

    protected onCompleteCallback: Function = () => {
    }

    constructor(options: HorizontalSlotMachineOptions = {}) {
        super()
        this.elementWidth = options.elementWidth ?? this.elementWidth
        this.elementHeight = options.elementHeight ?? this.elementHeight
        this.elementAmount = options.elementAmount ?? this.elementAmount
        this.arrowSlotIndex = options.arrowSlotIndex ?? this.arrowSlotIndex
        this.spinningTime = options.spinningTime ?? this.spinningTime
        this.winningIndex = options.winningIndex ?? this.winningIndex
        this.customWinningTexture = null
        this.backOutEffect = options.backOutEffect ?? this.backOutEffect
        this.verticalReduction = options.verticalReduction ?? this.verticalReduction
        this.skewFactor = options.skewFactor ?? this.skewFactor
        this.elementSpacing = options.elementSpacing ?? 0
        this.maskWidth = options.maskWidth ?? this.elementAmount * (this.elementWidth + this.elementSpacing)
        this.maskHeight = options.maskHeight ?? this.elementHeight
        this.rotationSpeed = options.rotationSpeed ?? this.rotationSpeed
        this.acceleration = options.acceleration ?? this.acceleration
        this.slotTextureUrls = options.slotTextureUrls ?? [
            'https://pixijs.com/assets/eggHead.png',
            'https://pixijs.com/assets/flowerTop.png',
            'https://pixijs.com/assets/helmlok.png',
            'https://pixijs.com/assets/skully.png'
        ]
        this.spinDirection = options.spinDirection ?? 1
        this.cylinderCurvature = options.cylinderCurvature ?? 1
        this.edgeNarrowing = options.edgeNarrowing ?? 0
        this.wheelScale = options.wheelScale ?? this.wheelScale
        this.wheelWidth = this.elementAmount * (this.elementWidth + this.elementSpacing)
        this.wheelHeight = this.elementHeight
        this.wheel = null
        this.tweening = []
        this.running = false
        this.slotTextures = []
        this.wheelSequence = []
    }

    public setWinningTexture(textureOrUrl: Texture | string): void {
        if (typeof textureOrUrl === 'string') {
            this.customWinningTexture = Texture.from(textureOrUrl)
        } else {
            this.customWinningTexture = textureOrUrl
        }
    }

    public async init(): Promise<void> {
        await Assets.load(this.slotTextureUrls)
        this.slotTextures = this.slotTextureUrls.map(url => Texture.from(url))
        this.createWheel()
    }

    public updatePosition(x: number = -this.wheelWidth * this.scale.x / 2, y: number = -this.wheelHeight * this.scale.y / 2): void {
        this.position.set(x, y)
    }

    public spin(onCompleteCallback: Function = () => {
    }): void {
        if (this.running || !this.wheel) return
        this.running = true
        this.onCompleteCallback = onCompleteCallback
        const basePos = Math.floor(this.wheel.position)
        const extraRotations = 4
        const directionalArrowOffset = this.spinDirection > 0 ? this.arrowSlotIndex : -this.arrowSlotIndex
        const target = basePos + this.spinDirection * (extraRotations * this.elementAmount) + directionalArrowOffset
        const sequenceLength = this.wheelSequence.length
        const finalIndex = (((Math.floor(target) % sequenceLength) + sequenceLength) % sequenceLength)
        if (this.customWinningTexture) {
            this.wheelSequence[finalIndex] = this.customWinningTexture
        } else {
            this.wheelSequence[finalIndex] = this.slotTextures[this.winningIndex]
        }
        const time = (this.spinningTime / this.rotationSpeed) * (1 / this.acceleration)
        this.tweenTo(
            this.wheel,
            'position',
            target,
            time,
            this.backOut(this.backOutEffect),
            null,
            this.onWheelComplete.bind(this)
        )
    }

    public update(deltaTime: number): void {
        if (!this.wheel) return
        this.updateTween()
        const w = this.wheel
        const fraction = w.position - Math.floor(w.position)
        const elementDistance = this.elementWidth + this.elementSpacing
        const totalWidth = this.elementAmount * elementDistance
        const centerX = totalWidth / 2
        const maxAngle = Math.PI / 2
        const radius = centerX / Math.sin(maxAngle)
        for (let j = 0; j < this.elementAmount + 1; j++) {
            const element = w.elements[j]
            const virtualIndex = Math.floor(w.position) + j
            const seqIndex = ((virtualIndex % this.wheelSequence.length) + this.wheelSequence.length) % this.wheelSequence.length
            const newTexture = this.wheelSequence[seqIndex]
            if (element.texture !== newTexture) {
                element.texture = newTexture
            }
            element.anchor.set(0.5)
            const baseScale = Math.min(this.elementWidth / newTexture.width, this.elementHeight / newTexture.height)
            const linearCenter = j * elementDistance - fraction * elementDistance + elementDistance / 2
            const dx = linearCenter - centerX
            const t = dx / centerX
            const angle = t * maxAngle
            if (Math.abs(angle) > Math.PI / 2) {
                element.visible = false
            } else {
                element.visible = true
                const cosAngle = Math.cos(angle)
                element.scale.x = baseScale * Math.pow(Math.abs(cosAngle), this.cylinderCurvature)
                const verticalScaleFactor = 1 - this.verticalReduction * (1 - cosAngle)
                element.scale.y = baseScale * verticalScaleFactor
                const narrowingFactor = 1 - this.edgeNarrowing * (1 - Math.cos(angle))
                element.x = centerX + radius * Math.sin(angle) * narrowingFactor
                element.y = this.elementHeight / 2
                element.skew.x = this.skewFactor ? angle * this.skewFactor : 0
            }
        }
    }

    protected updateTween(): void {
        const now = Date.now()
        const remove: any[] = []
        for (let i = 0; i < this.tweening.length; i++) {
            const t = this.tweening[i]
            const phase = Math.min(1, (now - t.start) / t.time)
            t.object[t.property] = this.interpolate(t.propertyBeginValue, t.target, t.easing(phase))
            if (t.change) t.change(t)
            if (phase === 1) {
                t.object[t.property] = t.target
                if (t.complete) t.complete(t)
                remove.push(t)
            }
        }
        remove.forEach(t => {
            this.tweening.splice(this.tweening.indexOf(t), 1)
        })
    }

    protected createWheel(): void {
        const elementDistance = this.elementWidth + this.elementSpacing
        const totalWidth = this.elementAmount * elementDistance
        const wheelContainer = new Container()
        const sequenceLength = 10 * this.elementAmount
        this.wheelSequence = new Array(sequenceLength)
            .fill(null)
            .map(() => this.slotTextures[Math.floor(Math.random() * this.slotTextureUrls.length)])
        const elements: Sprite[] = []
        for (let i = 0; i < this.elementAmount + 1; i++) {
            const texture = this.wheelSequence[i]
            const element = new Sprite(texture)
            element.anchor.set(0.5)
            element.scale.set(Math.min(this.elementWidth / texture.width, this.elementHeight / texture.height))
            element.x = elementDistance / 2
            element.y = this.elementHeight / 2
            elements.push(element)
            wheelContainer.addChild(element)
        }
        this.wheel = {container: wheelContainer, elements, position: 0}
        this.scale = this.wheelScale
        this.addChild(wheelContainer)

        const mask = new Graphics()
        mask.beginFill(0xffffff)
        mask.drawRect(-this.maskWidth / 2, -this.maskHeight / 2, this.maskWidth, this.maskHeight)
        mask.endFill()
        mask.x = wheelContainer.x + totalWidth / 2
        mask.y = wheelContainer.y + this.elementHeight / 2
        this.addChild(mask)
        wheelContainer.mask = mask
    }

    protected onWheelComplete(): void {
        this.running = false
        Ticker.shared.remove(this.update, this)
        this.onCompleteCallback()
    }

    protected tweenTo(
        object: any,
        property: string,
        target: number,
        time: number,
        easing: (t: number) => number,
        onchange: any,
        oncomplete: any
    ): any {
        const tween = {
            object,
            property,
            propertyBeginValue: object[property],
            target,
            easing,
            time,
            change: onchange,
            complete: oncomplete,
            start: Date.now()
        }
        this.tweening.push(tween)
        return tween
    }

    protected interpolate(a: number, b: number, t: number): number {
        return a * (1 - t) + b * t
    }

    protected backOut(amount: number): (t: number) => number {
        return t => --t * t * ((amount + 1) * t + amount) + 1
    }
}

export interface HorizontalSlotMachineOptions {
    elementWidth?: number;
    elementHeight?: number;
    elementAmount?: number;
    arrowSlotIndex?: number;
    spinningTime?: number;
    winningIndex?: number;
    backOutEffect?: number;
    verticalReduction?: number;
    skewFactor?: number;
    maskWidth?: number;
    maskHeight?: number;
    slotTextureUrls?: string[];
    rotationSpeed?: number;
    acceleration?: number;
    elementSpacing?: number;
    spinDirection?: number;
    cylinderCurvature?: number;
    edgeNarrowing?: number;
    wheelScale?: Point;
}