class DecisionTree {
  constructor(sceneName, condition = () => true) {
    this.sceneName = sceneName;
    this.condition = condition;
    this.nextScene = null;
  }

  setNextScene(nextSceneNode) {
    this.nextScene = nextSceneNode;
  }

  canAdvance() {
    return this.nextScene && this.nextScene.condition();
  }

  getNextSceneName() {
    return this.canAdvance() ? this.nextScene.sceneName : null;
  }
}

function bubbleSort(coins) {
  let len = coins.length;
  for (let i = 0; i < len - 1; i++) {
    for (let j = 0; j < len - 1 - i; j++) {
      if (coins[j].y > coins[j + 1].y) {
        let temp = coins[j];
        coins[j] = coins[j + 1];
        coins[j + 1] = temp;
      }
    }
  }
}

class Scene01 extends Phaser.Scene {
  constructor() {
    super("Scene01");

    this.sceneDecisionTree = new DecisionTree("Scene01");
    this.sceneDecisionTree.setNextScene(new DecisionTree("Scene02", () => true));


    // array para armazenar as moedas coletadas
    this.collectedCoinsList = [];
    this.remainingTime = 15; // Tempo do cronômetro em segundos
  }

  create() {
    this.sndMusic = this.sound.add("sndMusic");
    this.sndMusic.play({
      volume: 0.0,
      loop: false,
    });
    this.sndJump = this.sound.add("sndJump");
    this.sndGetCoin = this.sound.add("sndGetCoin");

    this.sky = this.add.image(0, 0, "sky").setOrigin(0);
    this.sky.displayWidth = 1000;
    this.sky.displayHeight = 600;

    this.player = this.physics.add
      .sprite(50, 500, "player")
      .setCollideWorldBounds(true)
      .setScale(2)
      .setBounce(0.4);
    this.player.canJump = true;
    this.player.body.setSize(16, 32);

    this.control = this.input.keyboard.createCursorKeys();

    this.platforms = this.physics.add.staticGroup();
    this.platforms
      .create(0, 600, "platform")
      .setScale(2.5, 1)
      .setOrigin(0, 1)
      .refreshBody();
    this.platforms.create(200, 200, "platform");
    this.platforms.create(1100, 200, "platform");
    this.platforms.create(1090, 475, "platform");
    this.platforms.create(600, 400, "platform").setScale(0.75, 1).refreshBody();

    this.mPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    let mPlatform = this.mPlatforms
      .create(150, 475, "platform")
      .setScale(0.25, 1);
    mPlatform.speed = 2;
    mPlatform.minX = 150;
    mPlatform.maxX = 300;

    mPlatform = this.mPlatforms.create(500, 280, "platform").setScale(0.25, 1);
    mPlatform.speed = 1;
    mPlatform.minX = 500;
    mPlatform.maxX = 800;

    this.totalCoins = 15;
    this.collectedCoins = 0;

    this.coins = this.physics.add.group({
      key: "coin",
      repeat: this.totalCoins - 1,
      setXY: { x: 12, y: -50, stepX: 70 },
    });

    // Criar o texto do cronômetro
    this.txtTimer = this.add
      .text(300, 15, `TIMER: ${this.remainingTime}s`, {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setShadow(0, 0, "#000", 3)
      .setScrollFactor(0);

    // Agendar uma chamada repetida para atualizar o cronômetro
    this.time.addEvent({
      delay: 1000, // 1 segundo
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // código que gera as moedas
    this.coins.children.iterate((coin) => {
      // definir o valor aleatorio para as moedas
      coin.value = Phaser.Math.Between(1, 99);

      // adicionar o texto sobre as moedas
      coin.valueText = this.add
        .text(coin.x, coin.y, coin.value, {
          fontSize: "12px",
          fill: "#ffffff",
          backgroundColor: "#000000",
          padding: { left: 2, right: 2, top: 1, bottom: 1 },
        })
        .setOrigin(0.5);

      coin.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      coin.anims.play("spin");
    });

    bubbleSort(this.coins.getChildren());

    this.score = 0;
    this.txtScore = this.add
      .text(15, 15, `COINS: ${this.score}`, { fontSize: "32px" })
      .setShadow(0, 0, "#000", 3)
      .setScrollFactor(0);
    this.setScore();

    this.enemies = this.physics.add.group();
    let enemy = this.enemies
      .create(Phaser.Math.Between(50, 950), 0, "enemy")
      .setBounce(1)
      .setCollideWorldBounds(true)
      .setVelocity(Math.random() < 0.5 ? -200 : 200, 50);

    this.physics.add.collider(
      this.player,
      this.mPlatforms,
      this.platformMovingThings
    );
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.enemyHit,
      null,
      this
    );
    this.physics.add.collider(
      this.coins,
      this.mPlatforms,
      this.platformMovingThings
    );
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.coins, this.platforms);
    this.physics.add.collider(this.enemies, this.mPlatforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin,
      null,
      this
    );

    this.physics.world.setBounds(0, 0, 1000, 600);
    this.cameras.main.setBounds(0, 0, 1000, 600).startFollow(this.player);

    this.gameOver = false;

    // botao do inventario
    this.inventoryButton = this.add
      .text(700, 15, "Inventory", {
        fontSize: "20px",
        backgroundColor: "#000",
        color: "#fff",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setInteractive()
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .on("pointerdown", () => this.showInventory());

    // Configurar a tecla "I" para abrir o inventário
    this.input.keyboard.on("keydown-I", () => {
      this.showInventory();
    });

    // Criar o grupo do inventário para exibição
    this.inventoryGroup = this.add.group();

    // Variável para rastrear o estado do inventário
    this.isInventoryOpen = false;

    // Configurar a tecla "I" para alternar o inventário
    this.input.keyboard.on("keydown-I", () => {
      this.toggleInventory();
    });
  }

  updateTimer() {
    console.log("cronometro atualizado: ", this.remainingTime);
    if (this.remainingTime > 0) {
      this.remainingTime--;
      this.txtTimer.setText(`TIMER: ${this.remainingTime}s`);
      // Efeito de alerta nos últimos 10 segundos
      if (this.remainingTime <= 10) {
        this.txtTimer.setColor("#ff0000");
      }
    } else {
      console.log("tempo esgotado! tentando avançar de fase...")
      this.advanceToNextLevel();
    }
  }

  enemyHit(player, enemy) {
    this.sndMusic.stop();
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.stop();
    this.gameOver = true;

    setTimeout(() => {
      this.add
        .text(game.config.width / 2, game.config.height / 2, "GAME OVER", {
          fontSize: "50px",
        })
        .setOrigin(0.5)
        .setShadow(0, 0, "#000", 3)
        .setScrollFactor(0);

      setTimeout(() => {
        this.add
          .text(
            game.config.width / 2,
            game.config.height / 2 + 50,
            "PRESS ENTER",
            { fontSize: "32px" }
          )
          .setOrigin(0.5)
          .setScrollFactor(0);

        this.input.keyboard.addKey("enter").on("down", () => {
          this.scene.start("StartScene");
        });
      }, 1000);
    }, 1000);
  }

  setScore() {
    this.txtScore.setText(
      this.score > 9 ? `SCORE: ${this.score}` : `SCORE: 0${this.score}`
    );
  }

  collectCoin(player, coin) {
    this.sndGetCoin.play();
    // Salvar a moeda coletada no inventário
    this.collectedCoinsList.push({ value: coin.value });

    if (coin.valueText) {
      coin.valueText.destroy();
    }

    coin.destroy();

    this.collectedCoins++;

    this.score += coin.value;
    this.setScore();

  }

  toggleInventory() {
    if (this.isInventoryOpen) {
      // Fechar o inventário
      this.inventoryGroup.clear(true, true);
      this.isInventoryOpen = false;
    } else {
      // Abrir o inventário
      this.showInventory();
      this.isInventoryOpen = true;
    }
  }

  showInventory() {
    // Limpar qualquer exibição anterior para evitar duplicações
    this.inventoryGroup.clear(true, true);

    // Obter posição atual da câmera
    const cameraX = this.cameras.main.worldView.x;
    const cameraY = this.cameras.main.worldView.y;

    // Fundo opaco para o inventário
    const bg = this.add.rectangle(
      cameraX + 500,
      cameraY + 300,
      400,
      300,
      0x000000,
      0.8
    );
    this.inventoryGroup.add(bg);

    // Exibir a lista de moedas coletadas
    let startY = cameraY + 180;
    this.collectedCoinsList.forEach((coin, index) => {
      const coinText = this.add.text(
        cameraX + 320,
        startY + index * 30,
        `Moeda ${index + 1}: ${coin.value}`,
        {
          fontSize: "20px",
          color: "#ffffff",
        }
      );
      this.inventoryGroup.add(coinText);
    });

    // Botão para fechar o inventário
    const closeButton = this.add
      .text(cameraX + 500, cameraY + 400, "Close", {
        fontSize: "20px",
        backgroundColor: "#ff0000",
        color: "#fff",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setInteractive()
      .setOrigin(0.5)
      .on("pointerdown", () => {
        this.toggleInventory(); // Fechar ao clicar no botão
      });
    this.inventoryGroup.add(closeButton);
  }

  advanceToNextLevel() {
    console.log("Avançando para a próxima fase...");
    this.sndMusic.stop();
    this.scene.start("Scene02", { score: this.score });
  }
  
  

  movePlatform(platform) {
    if (platform.x < platform.minX || platform.x > platform.maxX) {
      platform.speed *= -1;
    }
    platform.x += platform.speed;
  }

  platformMovingThings(sprite, platform) {
    sprite.x += platform.speed;
  }

  update() {
    if (!this.gameOver) {
      // Atualizar a posição dos textos sobre as moedas
      this.coins.children.iterate((coin) => {
        if (coin.valueText) {
          coin.valueText.setPosition(coin.x, coin.y - 20);
        }
      });

      // Atualizar os elementos do inventário, caso esteja aberto
      if (this.isInventoryOpen) {
        const cameraX = this.cameras.main.worldView.x;
        const cameraY = this.cameras.main.worldView.y;

        this.inventoryGroup.children.iterate((child, index) => {
          if (index === 0) {
            // Fundo do inventário
            child.setPosition(cameraX + 500, cameraY + 300);
          } else if (index === this.inventoryGroup.children.size - 1) {
            // Botão de fechar
            child.setPosition(cameraX + 500, cameraY + 400);
          } else {
            // Textos das moedas
            const coinIndex = index - 1; // Ajustar índice por causa do fundo
            child.setPosition(cameraX + 320, cameraY + 180 + coinIndex * 30);
          }
        });
      }

      // Controles do jogador
      if (this.control.left.isDown) {
        this.player.flipX = true;
        this.player.anims.play("walk", true);
        this.player.setVelocityX(-250);
      } else if (this.control.right.isDown) {
        this.player.flipX = false;
        this.player.anims.play("walk", true);
        this.player.setVelocityX(250);
      } else {
        this.player.setVelocityX(0).setFrame(0);
      }

      if (!this.player.body.touching.down) {
        this.player.setFrame(this.player.body.velocity.y < 0 ? 1 : 3);
      }

      if (
        this.control.up.isDown &&
        this.player.canJump &&
        this.player.body.touching.down
      ) {
        this.sndJump.play();
        this.player.setVelocityY(-700);
        this.player.canJump = false;
      }

      if (
        !this.control.up.isDown &&
        !this.player.canJump &&
        this.player.body.touching.down
      ) {
        this.player.canJump = true;
      }

      this.mPlatforms.children.iterate((platform) => {
        this.movePlatform(platform);
      });
    }
  }
}
