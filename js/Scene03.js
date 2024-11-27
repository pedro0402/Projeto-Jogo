class Scene03 extends Phaser.Scene {
  constructor() {
    super("Scene03");
    this.graph = {};
  }

  init(data) {
    this.score = data.score || 0;
    this.remainingTime = data.remainingTime || 0;
    this.collectedCoinsList = data.collectedCoinsList;
    console.log(
      "collectedCoinsList na função init da cena: ",
      this.collectedCoinsList
    );
  }

  create() {
    this.collectedCoins = 0;
    this.timerEvent = this.time.addEvent({
      delay: 1000, // 1 segundo
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
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

    // Variável para rastrear o estado do inventário
    this.isInventoryOpen = false;
    // Configurar a tecla "I" para abrir o inventário
    this.input.keyboard.on("keydown-I", () => {
      this.toggleInventory();
    });

    // Criar o grupo do inventário para exibição
    this.inventoryGroup = this.add.group();
    this.sndMusic = this.sound.add("sndMusic");
    this.sndMusic.play({
      volume: 0.0,
      loop: false,
    });
    this.sndJump = this.sound.add("sndJump");
    this.sndGetCoin = this.sound.add("sndGetCoin");

    this.createGraph();

    let startNode = 0;
    let endNode = 3;

    let path = this.findPath(startNode, endNode);
    console.log("Path found:", path);

    this.sky = this.add.image(0, 0, "sky").setOrigin(0);
    this.sky.displayWidth = 1000;
    this.sky.displayHeight = 600;
    this.sky.alpha = 0.5;

    this.player = this.physics.add
      .sprite(50, 500, "player")
      .setCollideWorldBounds(true)
      .setScale(2)
      .setBounce(0.4);
    this.player.canJump = true;
    this.player.body.setSize(16, 32);

    this.control = this.input.keyboard.createCursorKeys();

    this.platforms = this.physics.add.staticGroup();
    this.mPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.createRandomPlatforms();

    this.coins = this.physics.add.group({
      key: "coin",
      repeat: 14,
      setXY: {
        x: 12,
        y: -50,
        stepX: 70,
      },
    });

    // código que gera as moedas
    this.coins.children.iterate((coin) => {
      if (coin.valueText) {
        coin.valueText.setPosition(coin.x, coin.y - 20);
      }
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

    this.txtScore = this.add
      .text(15, 15, `SCORE: ${this.score}`, { fontSize: "32px" })
      .setShadow(0, 0, "#000", 3)
      .setScrollFactor(0);
    this.setScore();

    this.enemies = this.physics.add.group();

    for (let i = 0; i < 3; i++) {
      this.enemies
        .create(Phaser.Math.Between(50, 950), 0, "enemy")
        .setBounce(1)
        .setCollideWorldBounds(true)
        .setVelocity(Math.random() < 0.5 ? -200 : 200, 50);
    }

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

    // Criar o texto do cronômetro
    this.txtTimer = this.add
      .text(300, 15, `TIMER: ${this.remainingTime}s`, {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setShadow(0, 0, "#000", 3)
      .setScrollFactor(0);

  }
  toggleInventory() {
    if (this.isInventoryOpen) {
      this.inventoryGroup.clear(true, true);
      this.isInventoryOpen = false;
    } else {
      this.showInventory();
      this.isInventoryOpen = true;
    }
  }

  showInventory() {
    // Limpar qualquer exibição anterior para evitar duplicações
    this.inventoryGroup.clear(true, true);
    console.log("moedas coletadas: ", this.collectedCoinsList);

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

  createGraph() {
    this.graph = {
      0: [1, 4], // Chão conecta à plataforma 1 e à plataforma 4
      1: [0, 2, 5], // Plataforma 1 conecta ao chão, à plataforma 2 e à Plataforma Móvel 1
      2: [1, 3], // Plataforma 2 conecta à plataforma 1 e à plataforma 3
      3: [2], // Plataforma 3 conecta somente à plataforma 2
      4: [0], // Plataforma 4 conecta somente ao chão
      5: [1], // Plataforma Móvel 1 conecta à plataforma 1
      6: [1, 3], // Plataforma Móvel 2 conecta à plataforma 1 e à plataforma 3
    };
  }

  findPath(startNode, endNode) {
    let visited = new Set();
    let queue = [[startNode]];
    visited.add(startNode);

    while (queue.length > 0) {
      let path = queue.shift();
      let node = path[path.length - 1];

      if (node === endNode) {
        return path;
      }

      for (let neighbor of this.graph[node]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null;
  }

  createRandomPlatforms() {
    let platformData = [
      { x: 0, y: 600, scaleX: 2.5, scaleY: 1, originX: 0, originY: 1 },
      { x: 350, y: 190, scaleX: 1, scaleY: 1, originX: 0, originY: 0 },
      { x: 800, y: 150, scaleX: 1, scaleY: 1, originX: 0, originY: 0 },
      { x: 1050, y: 350, scaleX: 1, scaleY: 1, originX: 0, originY: 0 },
      { x: 600, y: 450, scaleX: 0.75, scaleY: 1, originX: 0, originY: 0 },
    ];

    Phaser.Utils.Array.Shuffle(platformData);

    platformData.forEach((platform) => {
      this.platforms
        .create(platform.x, platform.y, "platform")
        .setScale(platform.scaleX, platform.scaleY)
        .setOrigin(platform.originX, platform.originY)
        .refreshBody();
    });

    let mPlatform = this.mPlatforms
      .create(200, 375, "platform")
      .setScale(0.25, 1);
    mPlatform.speed = 2;
    mPlatform.minX = 200;
    mPlatform.maxX = 350;

    mPlatform = this.mPlatforms.create(550, 280, "platform").setScale(0.25, 1);
    mPlatform.speed = 1;
    mPlatform.minX = 550;
    mPlatform.maxX = 750;
  }

  endGame(reason) {
    // Parar a música e a física do jogo
    this.sndMusic.stop();
    this.physics.pause();
    // redefinindo a lista de moedas
    this.collectedCoinsList = [];
    this.collectedCoins = 0;
    this.score = 0;

    // Parar o evento do cronômetro
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // Marcar o jogador como "game over"
    this.player.setTint(0xff0000);
    this.player.anims.stop();
    this.gameOver = true;

    // Exibir mensagem de Game Over
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    let reasonText = reason || "GAME OVER";
    this.add
      .text(centerX, centerY - 50, reasonText, {
        fontSize: "50px",
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setShadow(0, 0, "#000", 3)
      .setScrollFactor(0);

    // Botão para reiniciar ou voltar ao menu inicial
    setTimeout(() => {
      this.add
        .text(centerX, centerY, "PRESS ENTER", {
          fontSize: "32px",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setScrollFactor(0);

      this.input.keyboard.addKey("ENTER").on("down", () => {
        this.scene.start("Scene01", {
          score: this.score,
          remainingTime: this.remainingTime,
          collectedCoinsList: this.collectedCoinsList,
        });
      });

      this.add
        .text(centerX, centerY + 50, "PRESS M FOR MENU", {
          fontSize: "20px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { left: 10, right: 10, top: 5, bottom: 5 },
        })
        .setOrigin(0.5)
        .setInteractive()
        .setScrollFactor(0);

      this.input.keyboard.addKey("M").on("down", () => {
        this.scene.start("StartScene"); // Vai para a cena do menu inicial
      });
    }, 1000);
  }

  enemyHit() {
    this.endGame("HIT BY ENEMY");
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

    if (this.collectedCoins === 10) {
      this.sndMusic.stop();
      this.scene.start("EndScene");
    }
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

  updateTimer() {
    if (this.gameOver) return; // Não continuar se o jogo já terminou
    if (this.remainingTime > 0) {
      this.remainingTime--;
      this.txtTimer.setText(`TIMER: ${this.remainingTime}s`);
      // Efeito de alerta nos últimos 10 segundos
      if (this.remainingTime <= 10) {
        this.txtTimer.setColor("#ff0000");
      }
    } else {
      // Tempo esgotado - terminar o jogo
      this.endGame("TIME UP");
    }
  }

  update() {
    if (!this.gameOver) {
        // Atualizar a posição dos textos sobre as moedas
      this.coins.children.iterate((coin) => {
        if (coin.valueText) {
          coin.valueText.setPosition(coin.x, coin.y - 20);
        }
      });
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
