let game

window.onload = function(){
	const config = {
		type: Phaser.Canvas, 
		width: 800,
		height: 600,
		scene: [Preload,StartScene,Scene01,Scene02, Scene03,EndScene],
		physics: {
			default: 'arcade',
			arcade: {
				gravity: {y: 1000},
				debug: false
			}
		},
		pixelArt: true
	}

	game = new Phaser.Game(config)
}