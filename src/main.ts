import {Application, Texture, Graphics, Text, TextStyle} from 'pixi.js'
import {HorizontalSlotMachine} from './HorizontalSlotMachine'

(async () => {
    const app = new Application({
        background: '#2931ff',
        resizeTo: window
    })
    document.body.appendChild(app.view as HTMLCanvasElement)

    const slotMachine = new HorizontalSlotMachine({
        elementWidth: 130,
        elementHeight: 150,
        elementAmount: 3,
        arrowSlotIndex: 1,
        spinningTime: 2000,
        winningIndex: 3,
        backOutEffect: 0.2,
        maxAnglePercent: 150,
        verticalReduction: 0.5,
        skewFactor: 0,
        // maskWidth: 400,
        maskHeight: 150,
        rotationSpeed: 1,
        acceleration: 0.3
    })
    await slotMachine.init()
    slotMachine.setWinningTexture(Texture.from('https://pixijs.com/assets/eggHead.png'))
    slotMachine.updatePosition((app.screen.width - (slotMachine.wheelWidth)) / 2, (app.screen.height - slotMachine.wheelHeight) / 2)

    const bottom = new Graphics()
    const btnWidth = 100
    const btnHeight = 100
    const btnRadius = 100
    let btnX = (app.screen.width - btnWidth) / 2
    let btnY = app.screen.height - btnHeight - 20
    bottom.beginFill(0x000000)
    bottom.drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius)
    bottom.endFill()
    bottom.interactive = true
    bottom.cursor = 'pointer'

    const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff'
    })
    const playText = new Text('SPIN!', style)
    playText.anchor.set(0.5)
    playText.x = btnX + btnWidth / 2
    playText.y = btnY + btnHeight / 2

    bottom.addListener('pointerdown', () => {
        slotMachine.spin()
    })

    const totalWidth = slotMachine.wheelWidth
    let containerX = (app.screen.width - totalWidth) / 2
    let containerY = (app.screen.height - slotMachine.wheelHeight) / 2
    const border = new Graphics()
    border.lineStyle(4, 0xff0000, 1)
    border.drawRect(containerX, containerY, totalWidth, slotMachine.wheelHeight)
    border.endFill()

    const arrow = new Graphics()
    arrow.beginFill(0xff0000)
    arrow.moveTo(0, 0)
    arrow.lineTo(30, 0)
    arrow.lineTo(15, 20)
    arrow.closePath()
    arrow.endFill()
    arrow.pivot.set(15, 10)
    arrow.x = containerX + totalWidth / 2
    arrow.y = containerY - 25


    app.stage.addChild(slotMachine)
    app.stage.addChild(bottom)
    app.stage.addChild(playText)
    app.stage.addChild(border)
    app.stage.addChild(arrow)


    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' || event.key === ' ') {
            slotMachine.spin()
        }
    })

    window.addEventListener('resize', () => {
        const totalWidth = slotMachine.wheelWidth
        slotMachine.updatePosition((app.screen.width - totalWidth) / 2, (app.screen.height - slotMachine.wheelHeight) / 2)

        btnX = (app.screen.width - btnWidth) / 2
        btnY = app.screen.height - btnHeight - 20
        bottom.x = 0
        bottom.clear()
        bottom.beginFill(0x000000)
        bottom.drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius)
        bottom.endFill()

        playText.x = btnX + btnWidth / 2
        playText.y = btnY + btnHeight / 2

        containerX = (app.screen.width - totalWidth) / 2
        containerY = (app.screen.height - slotMachine.wheelHeight) / 2

        border.clear()
        border.lineStyle(4, 0xff0000, 1)
        border.drawRect(containerX, containerY, totalWidth, slotMachine.wheelHeight)
        border.endFill()

        arrow.x = containerX + totalWidth / 2
        arrow.y = containerY - 25
    })

    app.ticker.add((delta) => {
        slotMachine.update(delta)
    })
})()