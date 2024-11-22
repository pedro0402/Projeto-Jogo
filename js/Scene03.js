class Scene03 extends Phaser.Scene {
    constructor() {
        super('Scene03');
        this.graph = {};
    }

    init(data) {
        this.score = data.score;
    }

    create() {
        this.sndMusic = this.sound.add('sndMusic');
        this.sndMusic.play({
            volume: 0.0,
            loop: false
        });
        this.sndJump = this.sound.add('sndJump');
        this.sndGetCoin = this.sound.add('sndGetCoin');

        this.createGraph();

        let startNode = 0; 
        let endNode = 3;  

        let path = this.findPath(startNode, endNode);
        console.log('Path found:', path);

        this.sky = this.add.image(0, 0, 'sky').setOrigin(0);
        this.sky.displayWidth = 1000;
        this.sky.displayHeight = 600;
        this.sky.alpha = 0.5;

        this.player = this.physics.add.sprite(50, 500, 'player')
            .setCollideWorldBounds(true)
            .setScale(2)
            .setBounce(0.4);
        this.player.canJump = true;
        this.player.body.setSize(16, 32);

        this.control = this.input.keyboard.createCursorKeys();

        this.platforms = this.physics.add.staticGroup();
        this.mPlatforms = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.createRandomPlatforms();

        this.coins = this.physics.add.group({
            key: 'coin',
            repeat: 14,
            setXY: {
                x: 12,
                y: -50,
                stepX: 70
            }
        });

        this.coins.children.iterate((coin) => {
            coin.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            coin.anims.play('spin');
        });

        this.txtScore = this.add.text(15, 15, `SCORE: ${this.score}`, { fontSize: '32px' })
            .setShadow(0, 0, '#000', 3)
            .setScrollFactor(0);
        this.setScore();

        this.enemies = this.physics.add.group();

        for (let i = 0; i < 3; i++) {
            this.enemies.create(Phaser.Math.Between(50, 950), 0, 'enemy')
                .setBounce(1)
                .setCollideWorldBounds(true)
                .setVelocity(Math.random() < 0.5 ? -200 : 200, 50);
        }

        this.physics.add.collider(this.player, this.mPlatforms, this.platformMovingThings);
        this.physics.add.collider(this.player, this.enemies, this.enemyHit, null, this);
        this.physics.add.collider(this.coins, this.mPlatforms, this.platformMovingThings);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.coins, this.platforms);
        this.physics.add.collider(this.enemies, this.mPlatforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        this.physics.world.setBounds(0, 0, 1000, 600);
        this.cameras.main.setBounds(0, 0, 1000, 600).startFollow(this.player);

        this.gameOver = false;
    }

    createGraph() {
        this.graph = {
            0: [1, 4], // Chão conecta à plataforma 1 e à plataforma 4
            1: [0, 2, 5], // Plataforma 1 conecta ao chão, à plataforma 2 e à Plataforma Móvel 1
            2: [1, 3], // Plataforma 2 conecta à plataforma 1 e à plataforma 3
            3: [2], // Plataforma 3 conecta somente à plataforma 2
            4: [0], // Plataforma 4 conecta somente ao chão
            5: [1], // Plataforma Móvel 1 conecta à plataforma 1
            6: [1, 3] // Plataforma Móvel 2 conecta à plataforma 1 e à plataforma 3
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
    
        platformData.forEach(platform => {
            this.platforms.create(platform.x, platform.y, 'platform')
                .setScale(platform.scaleX, platform.scaleY)
                .setOrigin(platform.originX, platform.originY)
                .refreshBody();
        });
    
        let mPlatform = this.mPlatforms.create(200, 375, 'platform').setScale(0.25, 1);
        mPlatform.speed = 2;
        mPlatform.minX = 200;
        mPlatform.maxX = 350;
    
        mPlatform = this.mPlatforms.create(550, 280, 'platform').setScale(0.25, 1);
        mPlatform.speed = 1;
        mPlatform.minX = 550;
        mPlatform.maxX = 750;
    }

    enemyHit(player, enemy) {
        this.sndMusic.stop();
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.stop();
        this.gameOver = true;

        setTimeout(() => {
            this.add.text(game.config.width / 2, game.config.height / 2, 'GAME OVER', { fontSize: '50px' })
                .setOrigin(0.5)
                .setShadow(0, 0, '#000', 3)
                .setScrollFactor(0);

            setTimeout(() => {
                this.add.text(game.config.width / 2, game.config.height / 2 + 50, 'PRESS ENTER', { fontSize: '32px' })
                    .setOrigin(0.5)
                    .setScrollFactor(0);

                this.input.keyboard.addKey('enter')
                    .on('down', () => {
                        this.scene.start('StartScene');
                    });
            }, 1000);
        }, 1000);
    }

    setScore() {
        this.txtScore.setText(this.score > 9 ? `SCORE: ${this.score}` : `SCORE: 0${this.score}`);
    }

    collectCoin(player, coin) {
        this.sndGetCoin.play();
        coin.destroy();
        this.score++;
        this.setScore();

        if(this.coins.countActive() <= 0){
            this.sndMusic.stop()
            this.scene.start('EndScene')
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

    update() {
        if (!this.gameOver) {
            if (this.control.left.isDown) {
                this.player.flipX = true;
                this.player.anims.play('walk', true);
                this.player.setVelocityX(-250);
            } else if (this.control.right.isDown) {
                this.player.flipX = false;
                this.player.anims.play('walk', true);
                this.player.setVelocityX(250);
            } else {
                this.player.setVelocityX(0).setFrame(0);
            }

            if (!this.player.body.touching.down) {
                this.player.setFrame(this.player.body.velocity.y < 0 ? 1 : 3);
            }

            if (this.control.up.isDown && this.player.canJump && this.player.body.touching.down) {
                this.sndJump.play();
                this.player.setVelocityY(-700);
                this.player.canJump = false;
            }

            if (!this.control.up.isDown && !this.player.canJump && this.player.body.touching.down) {
                this.player.canJump = true;
            }

            this.mPlatforms.children.iterate((platform) => {
                this.movePlatform(platform);
            });
        }
    }
}