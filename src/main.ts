import { Application, Texture, Graphics, Text, TextStyle } from "pixi.js";
import { HorizontalSlotMachine } from "./HorizontalSlotMachine";

(async () => {
    const app = new Application({
        background: '#2931ff',
        resizeTo: window
    });
    document.body.appendChild(app.view as HTMLCanvasElement);

    // Создаем слот-машину (логика колеса)
    const slotMachine = new HorizontalSlotMachine({
        elementWidth: 130,
        elementHeight: 150,
        symbolsAmount: 3,
        arrowSlotIndex: 1,
        spinningTime: 2000,
        winningIndex: 3,
        backOutEffect: 0.2,
        maxAnglePercent: 150,
        verticalReduction: 0.5,
        skewFactor: 0,
        maskWidth: 400,
        maskHeight: 150,
        rotationSpeed: 1,
        acceleration: 0.3
    });
    await slotMachine.init();
    slotMachine.setWinningTexture(Texture.from('https://pixijs.com/assets/eggHead.png'));

    // Добавляем контейнер слота в сцену

    // UI-элементы создаются отдельно

    // Кнопка (круглая)
    const bottom = new Graphics();
    const btnWidth = 100;
    const btnHeight = 100;
    const btnRadius = 100;
    const btnX = (app.screen.width - btnWidth) / 2;
    const btnY = app.screen.height - btnHeight - 20;
    bottom.beginFill(0x000000);
    bottom.drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
    bottom.endFill();
    bottom.interactive = true;
    bottom.cursor = 'pointer';

    const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff'
    });
    const playText = new Text('SPIN!', style);
    playText.anchor.set(0.5);
    playText.x = btnX + btnWidth / 2;
    playText.y = btnY + btnHeight / 2;

    bottom.addListener('pointerdown', () => {
        slotMachine.spin();
    });

    // Рамка (UI) — отображается вокруг области колеса
    const totalWidth = slotMachine['symbolsAmount'] * slotMachine['elementWidth'];
    const containerX = (window.innerWidth - totalWidth) / 2;
    const containerY = (window.innerHeight - slotMachine['elementHeight']) / 2;
    const border = new Graphics();
    border.lineStyle(4, 0xff0000, 1);
    border.drawRect(containerX, containerY, totalWidth, slotMachine['elementHeight']);
    border.endFill();

    // Стрелка (UI)
    const arrow = new Graphics();
    arrow.beginFill(0xff0000);
    arrow.moveTo(0, 0);
    arrow.lineTo(30, 0);
    arrow.lineTo(15, 20);
    arrow.closePath();
    arrow.endFill();
    arrow.pivot.set(15, 10);
    arrow.x = containerX + totalWidth / 2;
    arrow.y = containerY - 25;


    app.stage.addChild(slotMachine.container);
    app.stage.addChild(bottom);
    app.stage.addChild(playText);
    app.stage.addChild(border);
    app.stage.addChild(arrow);

    // Обработчик нажатия пробела
    document.addEventListener('keydown', (event) => {
        if (event.code === "Space" || event.key === " ") {
            slotMachine.spin();
        }
    });

    // Обновляем слот-машину в тикере
    app.ticker.add((delta) => {
        slotMachine.update(delta);
        slotMachine.updateTween();
    });
})();