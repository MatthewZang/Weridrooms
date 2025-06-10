# WEIRD ROOMS (WARNING, THIS GAME MIGHT CONTAIN FLASHING LIGHTS AND ENTITIES THAT WILL MAKE A JUMP SCARE WHEN THEY GET YOU LATER)

A 3D horror exploration game inspired by the backrooms concept. Players navigate through an infinite, unsettling space filled with yellow walls and pillars, collecting useful items while exploring the endless maze. Features realistic collision detection and a survival system. Do not use ones that haven't deployed properly.

## New Features ✨

- **Collision Detection**: You can no longer walk through walls or pillars - realistic movement!
- **Useful Items**: 5 different item types with actual effects
- **Survival System**: Health and energy stats that affect gameplay
- **Item Usage**: Use collected items with number keys (1, 2, 3)
- **Inventory Limit**: Maximum 5 items - strategic item management required!
- **No Server Required**: Runs directly in your browser!

## How to Run

Simply **double-click `index.html`** or open it in any modern web browser. No installation or server required!

## Controls

### Movement
- **WASD**: Move around
- **Mouse**: Look around (click to lock cursor)
- **Shift**: Sprint (drains energy)
- **Space**: Jump

### Items & Interaction
- **E**: Collect nearby items
- **1**: Use Energy Drink (restores energy)
- **2**: Use Health Kit (restores health)  
- **3**: Use Flashlight Battery (brightens area for 30 seconds)
- **Q**: Drop oldest item (when inventory is full)

## Item Types & Effects

| Item | Color | Effect | Rarity |
|------|-------|--------|---------|
| 🟢 **Energy Drink** | Green | Restores 25 energy | Common |
| 🔴 **Health Kit** | Red | Restores 30 health | Uncommon |
| 🟡 **Flashlight Battery** | Yellow | Brightens area temporarily | Rare |
| 🟠 **Old Photo** | Orange | Lore item with hidden secrets | Rare |

## Survival Mechanics

- **Energy**: Depletes when sprinting, regenerates when walking/standing
- **Health**: Currently for display (future: environmental damage)
- **Stamina System**: Can't sprint when energy is too low
- **Realistic Physics**: Collision detection prevents wall-clipping

## Level 0 Features

### Environment
- **Infinite Yellow Maze**: Procedurally generated rooms extend forever
- **Classic Backrooms**: Yellow walls, brown carpet, fluorescent lighting
- **Realistic Collisions**: Solid walls and pillars you cannot pass through
- **Performance Optimized**: Only nearby rooms render for smooth gameplay

### Exploration
- **Endless Discovery**: Each room layout is unique with random wall gaps
- **Item Hunting**: Rare collectibles scattered throughout the maze
- **Atmospheric Lighting**: Dim fluorescent ambiance with fog effects
- **Smooth Navigation**: First-person movement with mouse look

## Technical Improvements

- **Real Collision System**: AABB collision detection for all objects
- **Object Culling**: Collidable objects removed when rooms despawn
- **Item Variety**: 5 different collectible types with unique properties
- **UI Updates**: Real-time health/energy display and item management
- **Memory Efficient**: Optimized room generation and cleanup

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Chromium
- ✅ Firefox  
- ✅ Safari
- ✅ Edge

## Future Features

- **Level 1+**: Additional backrooms levels with unique mechanics
- **Entities**: Creatures that hunt the player
- **Sound System**: Ambient audio and sound effects
- **Save System**: Persistent progress and inventory
- **More Items**: Tools, weapons, and story elements
- **Multiplayer**: Co-op exploration mode

## Development

Built with vanilla JavaScript and Three.js:
- `index.html` - Game interface and styling
- `game.js` - Core game logic, physics, and rendering

The game uses modern web technologies for 3D graphics and runs entirely client-side with no backend required. 
