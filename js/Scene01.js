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

class Scene01 extends Phaser.Scene {
	constructor() {
		super('Scene01');

		this.sceneDecisionTree = new DecisionTree('Scene01');
		this.sceneDecisionTree.setNextScene(new DecisionTree('Scene02', () => this.collectedCoins >= this.totalCoins));
	}

	create() {
		this.sndMusic = this.sound.add('sndMusic');
		this.sndMusic.play({
			volume: 0.0,
			loop: false
		});
		this.sndJump = this.sound.add('sndJump');
		this.sndGetCoin = this.sound.add('sndGetCoin');

		this.sky = this.add.image(0, 0, 'sky').setOrigin(0);
		this.sky.displayWidth = 1000;
		this.sky.displayHeight = 600;

		this.player = this.physics.add.sprite(50, 500, 'player')
			.setCollideWorldBounds(true)
			.setScale(2)
			.setBounce(0.4);
		this.player.canJump = true;
		this.player.body.setSize(16, 32);

		this.control = this.input.keyboard.createCursorKeys();

		this.platforms = this.physics.add.staticGroup();
		this.platforms.create(0, 600, 'platform')
			.setScale(2.5, 1)
			.setOrigin(0, 1)
			.refreshBody();
		this.platforms.create(200, 200, 'platform');
		this.platforms.create(1100, 200, 'platform');
		this.platforms.create(1090, 475, 'platform');
		this.platforms.create(600, 400, 'platform')
			.setScale(0.75, 1)
			.refreshBody();

		this.mPlatforms = this.physics.add.group({
			allowGravity: false,
			immovable: true
		});

		let mPlatform = this.mPlatforms.create(150, 475, 'platform').setScale(0.25, 1);
		mPlatform.speed = 2;
		mPlatform.minX = 150;
		mPlatform.maxX = 300;

		mPlatform = this.mPlatforms.create(500, 280, 'platform').setScale(0.25, 1);
		mPlatform.speed = 1;
		mPlatform.minX = 500;
		mPlatform.maxX = 800;

		this.totalCoins = 15;
		this.collectedCoins = 0;
		this.coins = this.physics.add.group({
			key: 'coin',
			repeat: this.totalCoins - 1,
			setXY: { x: 12, y: -50, stepX: 70 }
		});

		this.coins.children.iterate((coin) => {
			coin.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
			coin.anims.play('spin');
		});

		this.score = 0;
		this.txtScore = this.add.text(15, 15, `COINS: ${this.score}`, { fontSize: '32px' })
			.setShadow(0, 0, '#000', 3)
			.setScrollFactor(0);
		this.setScore();

		this.enemies = this.physics.add.group();
		let enemy = this.enemies.create(Phaser.Math.Between(50, 950), 0, 'enemy')
			.setBounce(1)
			.setCollideWorldBounds(true)
			.setVelocity(Math.random() < 0.5 ? -200 : 200, 50);

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
		this.collectedCoins++;

		this.score++;
		this.setScore();

		this.advanceToNextLevel();
	}

	advanceToNextLevel() {
		const nextSceneName = this.sceneDecisionTree.getNextSceneName();

		if (nextSceneName) {
			this.sndMusic.stop();
			this.scene.start(nextSceneName, { score: this.score });
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