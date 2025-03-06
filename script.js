import * as PIXI from 'pixi.js';

// DOM Elements
const spritePromptInput = document.getElementById('sprite-prompt');
const generateBtn = document.getElementById('generate-btn');
const spriteImage = document.getElementById('sprite-image');
const loadingSprite = document.getElementById('loading-sprite');
const animationDisplay = document.querySelector('.animation-display');
const animateBtn = document.getElementById('animate-btn');
const loadingAnimation = document.getElementById('loading-animation');
const animationContainer = document.getElementById('animation-container');
const animationFrames = document.getElementById('animation-frames');
const gameContainer = document.querySelector('.game-container');
const startGameBtn = document.getElementById('start-game-btn');
const gameCanvas = document.getElementById('game-canvas');

// State variables
let generatedSpriteUrl = null;
let animationData = null;
let spriteFrames = null;
let game = null;

// Event listeners
generateBtn.addEventListener('click', generateSprite);
animateBtn.addEventListener('click', analyzeAndAnimateSprite);
startGameBtn.addEventListener('click', startGame);

// Generate sprite using the LLM
async function generateSprite() {
    const prompt = spritePromptInput.value.trim();
    if (!prompt) {
        alert('Please enter a description for your sprite');
        return;
    }
    
    // Update UI
    generateBtn.disabled = true;
    spriteImage.style.display = 'none';
    loadingSprite.style.display = 'block';
    animationDisplay.style.display = 'none';
    gameContainer.style.display = 'none';
    
    try {
        // Generate the sprite using AI image generation
        const fullPrompt = `A pixel art game sprite character: ${prompt}. Should be a simple 32x32 or 64x64 pixel character on transparent background. Use bright colors and clear outlines.`;
        
        const result = await websim.imageGen({
            prompt: fullPrompt,
            aspect_ratio: "1:1"
        });
        
        generatedSpriteUrl = result.url;
        
        // Display the generated sprite
        spriteImage.src = generatedSpriteUrl;
        spriteImage.onload = () => {
            spriteImage.style.display = 'block';
            loadingSprite.style.display = 'none';
            animationDisplay.style.display = 'block';
            generateBtn.disabled = false;
        };
    } catch (error) {
        console.error('Error generating sprite:', error);
        alert('Failed to generate sprite. Please try again.');
        loadingSprite.style.display = 'none';
        generateBtn.disabled = false;
    }
}

// Analyze sprite and generate animation frames
async function analyzeAndAnimateSprite() {
    if (!generatedSpriteUrl) {
        alert('Please generate a sprite first');
        return;
    }
    
    // Update UI
    animateBtn.disabled = true;
    loadingAnimation.style.display = 'block';
    gameContainer.style.display = 'none';
    
    try {
        // Instead of using LLM to analyze the sprite, use fixed animation data
        animationData = {
            frameCount: 4,
            frameWidth: 64,
            frameHeight: 64,
            animationSpeed: 0.1,
            animations: {
                idle: { 
                    description: "Character standing still with slight breathing movement", 
                    modifications: [] 
                },
                walkRight: { 
                    description: "Character walking to the right", 
                    modifications: [] 
                },
                walkLeft: { 
                    description: "Character walking to the left", 
                    modifications: [] 
                }
            }
        };
        
        // Create PIXI application for creating animations
        await createAnimationFrames();
        
        // Update UI
        loadingAnimation.style.display = 'none';
        animateBtn.disabled = false;
        gameContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Error creating animation:', error);
        alert('Failed to animate sprite. Please try again.');
        loadingAnimation.style.display = 'none';
        animateBtn.disabled = false;
    }
}

// Create animation frames based on sprite
async function createAnimationFrames() {
    // Clear previous frames
    animationContainer.innerHTML = '';
    animationFrames.innerHTML = '';
    
    // Initialize PIXI.js for creating our frames
    const app = new PIXI.Application({
        width: animationData.frameWidth,
        height: animationData.frameHeight,
        backgroundAlpha: 0
    });
    
    // Create a temporary element to hold the renderer
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    document.body.appendChild(tempElement);
    tempElement.appendChild(app.view);
    
    // Load the sprite texture
    const spriteTexture = await PIXI.Assets.load(generatedSpriteUrl);
    const originalSprite = new PIXI.Sprite(spriteTexture);
    originalSprite.width = animationData.frameWidth;
    originalSprite.height = animationData.frameHeight;
    
    // Create frames for all animations
    spriteFrames = {};
    
    for (const [animName, animInfo] of Object.entries(animationData.animations)) {
        spriteFrames[animName] = [];
        
        // For idle animation
        if (animName === 'idle') {
            // Create base frame
            const baseFrame = app.renderer.extract.base64(originalSprite);
            spriteFrames.idle.push(baseFrame);
            
            // Create breathing effect for other idle frames
            for (let i = 1; i < animationData.frameCount; i++) {
                const frame = new PIXI.Container();
                const sprite = new PIXI.Sprite(spriteTexture);
                sprite.width = animationData.frameWidth;
                sprite.height = animationData.frameHeight;
                
                // Slightly move the sprite up and down
                sprite.y = i % 2 === 0 ? 1 : -1;
                
                frame.addChild(sprite);
                app.stage.addChild(frame);
                
                // Extract frame as base64
                const frameBase64 = app.renderer.extract.base64(frame);
                spriteFrames.idle.push(frameBase64);
                
                // Clear stage for next frame
                app.stage.removeChildren();
            }
        } 
        // For walkRight animation
        else if (animName === 'walkRight') {
            for (let i = 0; i < animationData.frameCount; i++) {
                const frame = new PIXI.Container();
                const sprite = new PIXI.Sprite(spriteTexture);
                sprite.width = animationData.frameWidth;
                sprite.height = animationData.frameHeight;
                
                // Alternate leg positions and slight up/down movement
                sprite.y = i % 2 === 0 ? 1 : 0;
                sprite.x = i % 2 === 0 ? 1 : -1;
                
                frame.addChild(sprite);
                app.stage.addChild(frame);
                
                // Extract frame as base64
                const frameBase64 = app.renderer.extract.base64(frame);
                spriteFrames.walkRight.push(frameBase64);
                
                // Clear stage for next frame
                app.stage.removeChildren();
            }
        }
        // For walkLeft animation (flipped walkRight)
        else if (animName === 'walkLeft') {
            for (let i = 0; i < animationData.frameCount; i++) {
                const frame = new PIXI.Container();
                const sprite = new PIXI.Sprite(spriteTexture);
                sprite.width = animationData.frameWidth;
                sprite.height = animationData.frameHeight;
                
                // Flip horizontally
                sprite.scale.x = -1;
                sprite.x = animationData.frameWidth; // Offset to account for flipping
                
                // Apply same offsets as walkRight
                sprite.y = i % 2 === 0 ? 1 : 0;
                sprite.x += i % 2 === 0 ? -1 : 1; // Reverse the x offset because of flipping
                
                frame.addChild(sprite);
                app.stage.addChild(frame);
                
                // Extract frame as base64
                const frameBase64 = app.renderer.extract.base64(frame);
                spriteFrames.walkLeft.push(frameBase64);
                
                // Clear stage for next frame
                app.stage.removeChildren();
            }
        }
    }
    
    // Clean up temporary elements
    document.body.removeChild(tempElement);
    app.destroy(true);
    
    // Display preview of frames
    let animIndex = 0;
    const animations = Object.keys(spriteFrames);
    const currentAnim = animations[animIndex];
    
    // Show frame thumbnails
    spriteFrames[currentAnim].forEach((frameSrc, idx) => {
        const frameImg = document.createElement('img');
        frameImg.src = frameSrc;
        frameImg.classList.add('frame-img');
        if (idx === 0) frameImg.classList.add('selected');
        animationFrames.appendChild(frameImg);
    });
    
    // Show animation preview
    const previewImg = document.createElement('img');
    previewImg.src = spriteFrames[currentAnim][0];
    previewImg.style.width = '128px';
    previewImg.style.height = '128px';
    previewImg.style.imageRendering = 'pixelated';
    animationContainer.appendChild(previewImg);
    
    // Animate the preview
    let frameIdx = 0;
    setInterval(() => {
        frameIdx = (frameIdx + 1) % spriteFrames[currentAnim].length;
        previewImg.src = spriteFrames[currentAnim][frameIdx];
        
        // Update selected frame highlight
        document.querySelectorAll('.frame-img').forEach((img, idx) => {
            if (idx === frameIdx) {
                img.classList.add('selected');
            } else {
                img.classList.remove('selected');
            }
        });
    }, 200);
}

// Start the game with the animated sprite
function startGame() {
    if (!spriteFrames) {
        alert('Please generate and animate a sprite first');
        return;
    }
    
    // Clean up existing game if any
    if (game) {
        game.destroy(true);
    }
    
    // Initialize PIXI.js
    game = new PIXI.Application({
        view: gameCanvas,
        width: 800,
        height: 400,
        backgroundColor: 0x87CEEB, // Sky blue
    });
    
    // Create ground
    const ground = new PIXI.Graphics();
    ground.beginFill(0x8B4513); // Brown color
    ground.drawRect(0, 300, 800, 100);
    ground.endFill();
    game.stage.addChild(ground);
    
    // Create character sprite
    const characterTextures = {
        idle: spriteFrames.idle.map(src => PIXI.Texture.from(src)),
        walkRight: spriteFrames.walkRight.map(src => PIXI.Texture.from(src)),
        walkLeft: spriteFrames.walkLeft.map(src => PIXI.Texture.from(src)),
    };
    
    const character = new PIXI.AnimatedSprite(characterTextures.idle);
    character.scale.set(2, 2); // Scale up the pixel art
    character.x = 400;
    character.y = 300 - character.height;
    character.animationSpeed = 0.1;
    character.play();
    game.stage.addChild(character);
    
    // Character state
    const characterState = {
        speed: 3,
        isMoving: false,
        direction: 'right'
    };
    
    // Keyboard controls
    const keys = {};
    window.addEventListener('keydown', e => {
        keys[e.key] = true;
    });
    window.addEventListener('keyup', e => {
        keys[e.key] = false;
    });
    
    // Game loop
    game.ticker.add(() => {
        let isMoving = false;
        
        // Left and right movement
        if (keys['ArrowLeft']) {
            character.x -= characterState.speed;
            isMoving = true;
            characterState.direction = 'left';
            
            if (character.textures !== characterTextures.walkLeft) {
                character.textures = characterTextures.walkLeft;
                character.play();
            }
        } 
        else if (keys['ArrowRight']) {
            character.x += characterState.speed;
            isMoving = true;
            characterState.direction = 'right';
            
            if (character.textures !== characterTextures.walkRight) {
                character.textures = characterTextures.walkRight;
                character.play();
            }
        } 
        else if (!isMoving && character.textures !== characterTextures.idle) {
            character.textures = characterTextures.idle;
            character.play();
        }
        
        // Keep character within bounds
        if (character.x < 0) character.x = 0;
        if (character.x > game.screen.width - character.width) {
            character.x = game.screen.width - character.width;
        }
    });
    
    // Show instructions
    alert('Use the left and right arrow keys to move the character!');
}