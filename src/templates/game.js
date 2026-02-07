// Game development templates

function pygame(config) {
  return {
    requirements: `pygame>=2.5.0`,
    files: {
      'game.py': `#!/usr/bin/env python3
import pygame
import sys

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (102, 126, 234)
PURPLE = (118, 75, 162)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("${config.projectName}")
        self.clock = pygame.time.Clock()
        self.running = True
        self.player_pos = [SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2]
        self.player_speed = 5

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

        # Handle movement
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.player_pos[0] -= self.player_speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.player_pos[0] += self.player_speed
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.player_pos[1] -= self.player_speed
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.player_pos[1] += self.player_speed

        # Keep player on screen
        self.player_pos[0] = max(25, min(SCREEN_WIDTH - 25, self.player_pos[0]))
        self.player_pos[1] = max(25, min(SCREEN_HEIGHT - 25, self.player_pos[1]))

    def update(self):
        pass  # Add game logic here

    def draw(self):
        # Gradient background
        for y in range(SCREEN_HEIGHT):
            color_value = int(255 * (y / SCREEN_HEIGHT))
            color = (color_value // 2, color_value // 3, 200)
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))

        # Draw title
        font_large = pygame.font.Font(None, 48)
        title = font_large.render("🔨 ${config.projectName}", True, WHITE)
        self.screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, 50))

        # Draw description
        font_small = pygame.font.Font(None, 24)
        desc = font_small.render("${config.projectDescription}", True, WHITE)
        self.screen.blit(desc, (SCREEN_WIDTH // 2 - desc.get_width() // 2, 100))

        # Draw instructions
        instructions = font_small.render("Use WASD or Arrow Keys to move", True, WHITE)
        self.screen.blit(instructions, (SCREEN_WIDTH // 2 - instructions.get_width() // 2, 140))

        # Draw player
        pygame.draw.circle(self.screen, WHITE, self.player_pos, 25)
        pygame.draw.circle(self.screen, BLUE, self.player_pos, 20)

    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            pygame.display.flip()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Run the Game

\`\`\`bash
python game.py
\`\`\`

## Controls

- **WASD** or **Arrow Keys**: Move the player
- **ESC** or **Close Window**: Quit

## Development

Edit \`game.py\` to add:
- Game objects
- Collision detection
- Scoring system
- Levels
- Sound effects
`,
      '.gitignore': `venv/
__pycache__/
*.pyc`
    }
  };
}

function phaser(config) {
  return {
    packageJson: {
      name: config.projectName,
      version: "1.0.0",
      description: config.projectDescription,
      scripts: {
        start: "npx http-server -p 8000 -o"
      },
      dependencies: {
        phaser: "^3.70.0"
      },
      devDependencies: {
        "http-server": "^14.1.1"
      }
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.projectName}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body>
    <script src="game.js"></script>
</body>
</html>`,
      'game.js': `class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Assets can be loaded here
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x667eea);

        // Title
        this.add.text(width/2, 100, '🔨 ${config.projectName}', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Description
        this.add.text(width/2, 160, '${config.projectDescription}', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(width/2, 220, 'Click to add circles', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Interactive area
        this.input.on('pointerdown', (pointer) => {
            const circle = this.add.circle(pointer.x, pointer.y, 30, 0xffffff);
            
            // Animate
            this.tweens.add({
                targets: circle,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => circle.destroy()
            });
        });

        // Score
        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff'
        });

        // Sample sprite that can be moved
        this.player = this.add.circle(width/2, height/2, 25, 0xffffff);
        this.physics.add.existing(this.player);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        // Move player
        const speed = 200;
        
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        } else {
            this.player.body.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
        } else {
            this.player.body.setVelocityY(0);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Setup

\`\`\`bash
npm install
\`\`\`

## Run the Game

\`\`\`bash
npm start
\`\`\`

The game will open in your browser at http://localhost:8000

## Controls

- **Arrow Keys**: Move the player
- **Click**: Add circles

## Development

Edit \`game.js\` to add:
- Game assets (sprites, sounds)
- More game objects
- Collision detection
- Scoring logic
- Levels
`,
      '.gitignore': `node_modules/
*.log`
    }
  };
}

module.exports = {
  pygame,
  phaser
};
