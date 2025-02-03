import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";

export interface HorizontalSlotMachineOptions {
    elementWidth?: number;
    elementHeight?: number;
    symbolsAmount?: number;
    arrowSlotIndex?: number;
    spinningTime?: number;
    winningIndex?: number;
    backOutEffect?: number;
    maxAnglePercent?: number;
    verticalReduction?: number;
    skewFactor?: number;
    maskWidth?: number;
    maskHeight?: number;
    slotTextureUrls?: string[];
    rotationSpeed?: number;
    acceleration?: number;
}

export class HorizontalSlotMachine {
    // Параметры
    public elementWidth: number;
    public elementHeight: number;
    public symbolsAmount: number;
    public arrowSlotIndex: number;
    public spinningTime: number;
    public winningIndex: number;
    public customWinningTexture: Texture | null;
    public backOutEffect: number;
    public maxAnglePercent: number;
    public verticalReduction: number;
    public skewFactor: number;
    public maskWidth: number;
    public maskHeight: number;
    public rotationSpeed: number;
    public acceleration: number;
    public slotTextureUrls: string[];

    // Логика вращения
    protected wheel: { container: Container; symbols: Sprite[]; position: number } | null;
    protected tweening: any[];
    protected running: boolean;
    protected slotTextures: Texture[];
    protected wheelSequence: Texture[];

    // Контейнер, который создается классом
    public container: Container;

    constructor(options: HorizontalSlotMachineOptions = {}) {
        this.elementWidth = options.elementWidth ?? 150;
        this.elementHeight = options.elementHeight ?? 150;
        this.symbolsAmount = options.symbolsAmount ?? 5;
        this.arrowSlotIndex = options.arrowSlotIndex ?? 2;
        this.spinningTime = options.spinningTime ?? 5000;
        this.winningIndex = options.winningIndex ?? 3;
        this.customWinningTexture = null;
        this.backOutEffect = options.backOutEffect ?? 0.5;
        this.maxAnglePercent = options.maxAnglePercent ?? 100;
        this.verticalReduction = options.verticalReduction ?? 0.1;
        this.skewFactor = options.skewFactor ?? 0;
        this.maskWidth = options.maskWidth ?? this.symbolsAmount * this.elementWidth;
        this.maskHeight = options.maskHeight ?? this.elementHeight;
        this.rotationSpeed = options.rotationSpeed ?? 1;
        this.acceleration = options.acceleration ?? 1;
        this.slotTextureUrls = options.slotTextureUrls ?? [
            'https://pixijs.com/assets/eggHead.png',
            'https://pixijs.com/assets/flowerTop.png',
            'https://pixijs.com/assets/helmlok.png',
            'https://pixijs.com/assets/skully.png'
        ];

        this.container = new Container();
        // Центрируем контейнер по экрану (используем window.innerWidth/Height)
        const totalWidth = this.symbolsAmount * this.elementWidth;
        this.container.x = (window.innerWidth - totalWidth) / 2;
        this.container.y = (window.innerHeight - this.elementHeight) / 2;

        this.wheel = null;
        this.tweening = [];
        this.running = false;
        this.slotTextures = [];
        this.wheelSequence = [];
    }

    public setWinningTexture(textureOrUrl: Texture | string): void {
        if (typeof textureOrUrl === 'string') {
            this.customWinningTexture = Texture.from(textureOrUrl);
        } else {
            this.customWinningTexture = textureOrUrl;
        }
    }

    public async init(): Promise<void> {
        await Assets.load(this.slotTextureUrls);
        this.slotTextures = this.slotTextureUrls.map(url => Texture.from(url));
        this.createWheel();
    }

    protected createWheel(): void {
        const totalWidth = this.symbolsAmount * this.elementWidth;
        // Создаем отдельный контейнер для "колеса"
        const wheelContainer = new Container();
        // Центрируем контейнер внутри внешнего container (если нужно, можно менять позиционирование)
        wheelContainer.x = (this.container.width - totalWidth) / 2;
        wheelContainer.y = 0; // оставляем вертикальное положение 0 внутри нашего container

        const sequenceLength = 10 * this.symbolsAmount;
        this.wheelSequence = new Array(sequenceLength)
            .fill(null)
            .map(() => this.slotTextures[Math.floor(Math.random() * this.slotTextureUrls.length)]);

        const symbols: Sprite[] = [];
        for (let i = 0; i < this.symbolsAmount + 1; i++) {
            const texture = this.wheelSequence[i];
            const symbol = new Sprite(texture);
            symbol.anchor.set(0.5);
            symbol.scale.set(Math.min(this.elementWidth / texture.width, this.elementHeight / texture.height));
            symbol.x = this.elementWidth / 2;
            symbol.y = this.elementHeight / 2;
            symbols.push(symbol);
            wheelContainer.addChild(symbol);
        }
        this.wheel = { container: wheelContainer, symbols, position: 0 };

        // Добавляем колесо в наш основной контейнер
        this.container.addChild(wheelContainer);

        // Создаем маску, центрированную относительно колеса
        const mask = new Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(-this.maskWidth / 2, -this.maskHeight / 2, this.maskWidth, this.maskHeight);
        mask.endFill();
        mask.x = wheelContainer.x + totalWidth / 2;
        mask.y = wheelContainer.y + this.elementHeight / 2;
        this.container.addChild(mask);
        wheelContainer.mask = mask;
    }

    public spin(): void {
        if (this.running || !this.wheel) return;
        this.running = true;
        const basePos = Math.floor(this.wheel.position);
        const extraRotations = 4;
        const target = basePos + extraRotations * this.symbolsAmount + this.arrowSlotIndex;
        const sequenceLength = this.wheelSequence.length;
        const finalIndex = ((Math.floor(target)) % sequenceLength + sequenceLength) % sequenceLength + this.arrowSlotIndex;
        if (this.customWinningTexture) {
            this.wheelSequence[finalIndex] = this.customWinningTexture;
        } else {
            this.wheelSequence[finalIndex] = this.slotTextures[this.winningIndex];
        }
        const time = this.spinningTime / this.rotationSpeed * (1 / this.acceleration);
        this.tweenTo(this.wheel, 'position', target, time, this.backout(this.backOutEffect), null, this.onWheelComplete.bind(this));
    }

    protected onWheelComplete(): void {
        this.running = false;
    }

    // Метод, который должен вызываться из внешнего тикера
    public update(deltaTime: number): void {
        // Можно использовать deltaTime, если требуется
        if (!this.wheel) return;
        const w = this.wheel;
        const fraction = w.position - Math.floor(w.position);
        const sequenceLength = this.wheelSequence.length;
        const totalWidth = this.symbolsAmount * this.elementWidth;
        const centerX = totalWidth / 2;
        const maxAngle = (this.maxAnglePercent / 100) * (Math.PI / 4);
        const radius = centerX / Math.sin(maxAngle);
        for (let j = 0; j < this.symbolsAmount + 1; j++) {
            const symbol = w.symbols[j];
            const virtualIndex = Math.floor(w.position) + j;
            const seqIndex = ((virtualIndex % sequenceLength) + sequenceLength) % sequenceLength;
            const newTexture = this.wheelSequence[seqIndex];
            if (symbol.texture !== newTexture) {
                symbol.texture = newTexture;
            }
            symbol.anchor.set(0.5);
            const baseScale = Math.min(this.elementWidth / newTexture.width, this.elementHeight / newTexture.height);
            const linearCenter = j * this.elementWidth - fraction * this.elementWidth + this.elementWidth / 2;
            const dx = linearCenter - centerX;
            const t = dx / centerX;
            const angle = t * maxAngle;
            const cosAngle = Math.cos(angle);
            symbol.scale.x = baseScale * Math.abs(cosAngle);
            const verticalScaleFactor = 1 - this.verticalReduction * (1 - cosAngle);
            symbol.scale.y = baseScale * verticalScaleFactor;
            symbol.x = centerX + radius * Math.sin(angle);
            symbol.y = this.elementHeight / 2;
            if (this.skewFactor) {
                symbol.skew.x = angle * this.skewFactor;
            } else {
                symbol.skew.x = 0;
            }
        }
    }

    public updateTween(): void {
        const now = Date.now();
        const remove: any[] = [];
        for (let i = 0; i < this.tweening.length; i++) {
            const t = this.tweening[i];
            const phase = Math.min(1, (now - t.start) / t.time);
            t.object[t.property] = this.lerp(t.propertyBeginValue, t.target, t.easing(phase));
            if (t.change) t.change(t);
            if (phase === 1) {
                t.object[t.property] = t.target;
                if (t.complete) t.complete(t);
                remove.push(t);
            }
        }
        remove.forEach(t => {
            this.tweening.splice(this.tweening.indexOf(t), 1);
        });
    }

    protected tweenTo(object: any, property: string, target: number, time: number, easing: (t: number) => number, onchange: any, oncomplete: any): any {
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
        };
        this.tweening.push(tween);
        return tween;
    }

    protected lerp(a: number, b: number, t: number): number {
        return a * (1 - t) + b * t;
    }

    protected backout(amount: number): (t: number) => number {
        return t => --t * t * ((amount + 1) * t + amount) + 1;
    }
}