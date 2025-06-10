// Backrooms Level 0 Game
class BackroomsGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentLevel = 0; // 0 = Backrooms Level 0, 1 = Pool Rooms
        this.player = {
            position: new THREE.Vector3(25, 1, 25), // Start in center of first room, away from walls
            velocity: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            speed: 5,
            sprintSpeed: 8,
            jumpPower: 8,
            onGround: true,
            health: 100,
            energy: 100,
            radius: 0.5 // For collision detection
        };
        this.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            sprint: false,
            jump: false
        };
        this.inventory = [];
        this.rooms = new Map();
        this.currentRoom = { x: 0, z: 0 };
        this.renderDistance = 2;
        this.roomSize = 50;
        this.collectibles = [];
        this.collidableObjects = []; // For collision detection
        this.roomItems = new Map();
        this.doors = []; // For level transitions
        this.walkTimer = 0; // Track walking time for pool room requirement
        this.hasWalkedEnough = false; // Flag to track if player has walked 30+ seconds
        
        // Available levels for random teleportation
        this.availableLevels = [
            { id: 0, name: 'Backrooms Level 0' },
            { id: 1, name: 'Pool Rooms' },
            { id: 2, name: 'The Office' },
            { id: 3, name: 'Dark Halls' }
        ];
        
        // Item types with different effects - making them much rarer
        this.itemTypes = [
            { name: 'Energy Drink', color: 0x00ff00, effect: 'energy', value: 25, rarity: 0.02 },
            { name: 'Flashlight Battery', color: 0xffff00, effect: 'light', value: 1, rarity: 0.015 },
            { name: 'Health Kit', color: 0xff0000, effect: 'health', value: 30, rarity: 0.01 },
            { name: 'Old Photo', color: 0xffa500, effect: 'lore', value: 1, rarity: 0.005 }
        ];
        
        this.init();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x404040);
        this.scene.fog = new THREE.Fog(0x404040, 20, 100);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(this.player.position);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // Add lighting
        this.setupLighting();

        // Generate initial rooms
        this.generateRooms();

        // Setup controls
        this.setupControls();

        // Start game loop
        this.animate();

        // Hide loading screen
        document.getElementById('loading').style.display = 'none';
        
        // Update UI initially
        this.updateUI();
    }

    setupLighting() {
        // Ambient light (yellowish like fluorescent)
        const ambientLight = new THREE.AmbientLight(0xffffcc, 0.6);
        this.scene.add(ambientLight);

        // Directional light from ceiling
        const directionalLight = new THREE.DirectionalLight(0xffffcc, 0.8);
        directionalLight.position.set(0, 10, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    generateRooms() {
        const currentRoomX = Math.floor(this.player.position.x / this.roomSize);
        const currentRoomZ = Math.floor(this.player.position.z / this.roomSize);

        // Generate rooms around player
        for (let x = currentRoomX - this.renderDistance; x <= currentRoomX + this.renderDistance; x++) {
            for (let z = currentRoomZ - this.renderDistance; z <= currentRoomZ + this.renderDistance; z++) {
                const roomKey = `${x},${z}`;
                if (!this.rooms.has(roomKey)) {
                    this.createRoom(x, z);
                }
            }
        }

        // Remove distant rooms
        this.rooms.forEach((room, key) => {
            const [roomX, roomZ] = key.split(',').map(Number);
            if (Math.abs(roomX - currentRoomX) > this.renderDistance || 
                Math.abs(roomZ - currentRoomZ) > this.renderDistance) {
                this.scene.remove(room);
                this.rooms.delete(key);
                
                // Remove collidable objects from this room
                this.collidableObjects = this.collidableObjects.filter(obj => {
                    const objRoomX = Math.floor(obj.position.x / this.roomSize);
                    const objRoomZ = Math.floor(obj.position.z / this.roomSize);
                    return !(objRoomX === roomX && objRoomZ === roomZ);
                });
            }
        });
    }

    createRoom(roomX, roomZ) {
        if (this.currentLevel === 0) {
            this.createBackroomsRoom(roomX, roomZ);
        } else if (this.currentLevel === 1) {
            this.createPoolRoom(roomX, roomZ);
        } else if (this.currentLevel === 2) {
            this.createOfficeRoom(roomX, roomZ);
        } else if (this.currentLevel === 3) {
            this.createDarkHallRoom(roomX, roomZ);
        }
    }

    createBackroomsRoom(roomX, roomZ) {
        const room = new THREE.Group();
        const offsetX = roomX * this.roomSize;
        const offsetZ = roomZ * this.roomSize;

        // Materials
        const yellowWallMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xfffacd });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(this.roomSize, this.roomSize);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(offsetX + this.roomSize/2, 0, offsetZ + this.roomSize/2);
        floor.receiveShadow = true;
        room.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(offsetX + this.roomSize/2, 8, offsetZ + this.roomSize/2);
        room.add(ceiling);

        // Create pillars
        const pillarGeometry = new THREE.BoxGeometry(1, 8, 1);
        for (let x = 0; x < this.roomSize; x += 8) {
            for (let z = 0; z < this.roomSize; z += 8) {
                if (x > 0 && z > 0 && x < this.roomSize - 1 && z < this.roomSize - 1) {
                    const pillar = new THREE.Mesh(pillarGeometry, yellowWallMaterial);
                    pillar.position.set(offsetX + x, 4, offsetZ + z);
                    pillar.castShadow = true;
                    room.add(pillar);
                    
                    // Add to collidable objects
                    this.collidableObjects.push({
                        position: pillar.position.clone(),
                        size: { x: 1, y: 8, z: 1 },
                        type: 'pillar'
                    });
                }
            }
        }

        // Create walls with random gaps for passages
        const wallHeight = 8;
        const wallThickness = 0.5;
        for (let i = 0; i < this.roomSize; i += 2) {
            // North wall
            if (Math.random() > 0.6) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(2, wallHeight, wallThickness),
                    yellowWallMaterial
                );
                wall.position.set(offsetX + i, wallHeight/2, offsetZ + this.roomSize);
                wall.castShadow = true;
                room.add(wall);
                
                // Add to collidable objects
                this.collidableObjects.push({
                    position: wall.position.clone(),
                    size: { x: 2, y: wallHeight, z: wallThickness },
                    type: 'wall'
                });
            }

            // South wall
            if (Math.random() > 0.6) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(2, wallHeight, wallThickness),
                    yellowWallMaterial
                );
                wall.position.set(offsetX + i, wallHeight/2, offsetZ);
                wall.castShadow = true;
                room.add(wall);
                
                // Add to collidable objects
                this.collidableObjects.push({
                    position: wall.position.clone(),
                    size: { x: 2, y: wallHeight, z: wallThickness },
                    type: 'wall'
                });
            }

            // East wall
            if (Math.random() > 0.6) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(wallThickness, wallHeight, 2),
                    yellowWallMaterial
                );
                wall.position.set(offsetX + this.roomSize, wallHeight/2, offsetZ + i);
                wall.castShadow = true;
                room.add(wall);
                
                // Add to collidable objects
                this.collidableObjects.push({
                    position: wall.position.clone(),
                    size: { x: wallThickness, y: wallHeight, z: 2 },
                    type: 'wall'
                });
            }

            // West wall
            if (Math.random() > 0.6) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(wallThickness, wallHeight, 2),
                    yellowWallMaterial
                );
                wall.position.set(offsetX, wallHeight/2, offsetZ + i);
                wall.castShadow = true;
                room.add(wall);
                
                // Add to collidable objects
                this.collidableObjects.push({
                    position: wall.position.clone(),
                    size: { x: wallThickness, y: wallHeight, z: 2 },
                    type: 'wall'
                });
            }
        }

        // 25% chance to spawn a door to Pool Rooms (only if player has walked 30+ seconds)
        if (this.hasWalkedEnough && Math.random() < 0.25) {
            this.createDoor(room, offsetX, offsetZ, 'poolrooms');
        }

        // Add some collectibles randomly
        this.addCollectibles(room, offsetX, offsetZ);

        this.scene.add(room);
        this.rooms.set(`${roomX},${roomZ}`, room);
    }

    createPoolRoom(roomX, roomZ) {
        const room = new THREE.Group();
        const offsetX = roomX * this.roomSize;
        const offsetZ = roomZ * this.roomSize;

        // Pool room materials
        const poolWaterMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc, transparent: true, opacity: 0.9 });
        const stairMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

        // Floor (all water - walkable)
        const floorGeometry = new THREE.PlaneGeometry(this.roomSize, this.roomSize);
        const waterFloor = new THREE.Mesh(floorGeometry, poolWaterMaterial);
        waterFloor.rotation.x = -Math.PI / 2;
        waterFloor.position.set(offsetX + this.roomSize/2, 0, offsetZ + this.roomSize/2);
        waterFloor.receiveShadow = true;
        room.add(waterFloor);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(offsetX + this.roomSize/2, 8, offsetZ + this.roomSize/2);
        room.add(ceiling);

        // Create some deeper water areas (visual only - still walkable)
        const deepWaterCount = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < deepWaterCount; i++) {
            const deepX = offsetX + 10 + (i * 25);
            const deepZ = offsetZ + 15;
            const deepWidth = 20;
            const deepDepth = 15;

            // Deeper water area (darker blue, slightly lower)
            const deepWaterMaterial = new THREE.MeshLambertMaterial({ color: 0x003388, transparent: true, opacity: 0.8 });
            const deepWaterGeometry = new THREE.PlaneGeometry(deepWidth, deepDepth);
            const deepWater = new THREE.Mesh(deepWaterGeometry, deepWaterMaterial);
            deepWater.rotation.x = -Math.PI / 2;
            deepWater.position.set(deepX, -0.2, deepZ);
            room.add(deepWater);
            
            // No collision - player can walk through water
        }

        // Create some stairs (inaccessible)
        if (Math.random() < 0.3) { // 30% chance for stairs
            const stairX = offsetX + Math.random() * (this.roomSize - 10) + 5;
            const stairZ = offsetZ + Math.random() * (this.roomSize - 10) + 5;
            
            // Create staircase
            for (let step = 0; step < 8; step++) {
                const stepGeometry = new THREE.BoxGeometry(6, 0.5, 2);
                const stepMesh = new THREE.Mesh(stepGeometry, stairMaterial);
                stepMesh.position.set(stairX, step * 0.5 + 0.25, stairZ + step * 0.8);
                stepMesh.castShadow = true;
                room.add(stepMesh);

                // Add collision for each step
                this.collidableObjects.push({
                    position: stepMesh.position.clone(),
                    size: { x: 6, y: 0.5, z: 2 },
                    type: 'stair'
                });
            }
        }

        // 25% chance to spawn a door back to Level 0 (only if player has walked 30+ seconds)
        if (this.hasWalkedEnough && Math.random() < 0.25) {
            this.createDoor(room, offsetX, offsetZ, 'backrooms');
        }

        // 15% chance to spawn a special water door for random level teleportation
        if (this.hasWalkedEnough && Math.random() < 0.15) {
            this.createWaterDoor(room, offsetX, offsetZ);
        }

        // Add some collectibles randomly
        this.addCollectibles(room, offsetX, offsetZ);

        this.scene.add(room);
        this.rooms.set(`${roomX},${roomZ}`, room);
    }

    createOfficeRoom(roomX, roomZ) {
        const room = new THREE.Group();
        const offsetX = roomX * this.roomSize;
        const offsetZ = roomZ * this.roomSize;

        // Office materials
        const carpetMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const deskMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

        // Floor (carpet)
        const floorGeometry = new THREE.PlaneGeometry(this.roomSize, this.roomSize);
        const floor = new THREE.Mesh(floorGeometry, carpetMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(offsetX + this.roomSize/2, 0, offsetZ + this.roomSize/2);
        floor.receiveShadow = true;
        room.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(offsetX + this.roomSize/2, 8, offsetZ + this.roomSize/2);
        room.add(ceiling);

        // Office desks
        for (let i = 0; i < 3; i++) {
            const deskX = offsetX + 10 + (i * 15);
            const deskZ = offsetZ + 20;
            
            const deskGeometry = new THREE.BoxGeometry(8, 3, 4);
            const desk = new THREE.Mesh(deskGeometry, deskMaterial);
            desk.position.set(deskX, 1.5, deskZ);
            desk.castShadow = true;
            room.add(desk);
            
            // Add collision for desk
            this.collidableObjects.push({
                position: desk.position.clone(),
                size: { x: 8, y: 3, z: 4 },
                type: 'desk'
            });
        }

        // Door spawn (same 25% chance rule)
        if (this.hasWalkedEnough && Math.random() < 0.25) {
            this.createDoor(room, offsetX, offsetZ, 'backrooms');
        }

        this.addCollectibles(room, offsetX, offsetZ);
        this.scene.add(room);
        this.rooms.set(`${roomX},${roomZ}`, room);
    }

    createDarkHallRoom(roomX, roomZ) {
        const room = new THREE.Group();
        const offsetX = roomX * this.roomSize;
        const offsetZ = roomZ * this.roomSize;

        // Dark hall materials with slightly brighter colors
        const darkFloorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const darkCeilingMaterial = new THREE.MeshLambertMaterial({ color: 0x151515 });
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x202020 });

        // Narrow hallway dimensions
        const hallwayWidth = 4;
        const wallHeight = 8;

        // Floor (narrow)
        const floorGeometry = new THREE.PlaneGeometry(this.roomSize, hallwayWidth);
        const floor = new THREE.Mesh(floorGeometry, darkFloorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(offsetX + this.roomSize/2, 0, offsetZ + this.roomSize/2);
        floor.receiveShadow = true;
        room.add(floor);

        // Ceiling (narrow)
        const ceiling = new THREE.Mesh(floorGeometry, darkCeilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(offsetX + this.roomSize/2, wallHeight, offsetZ + this.roomSize/2);
        room.add(ceiling);

        // Side walls
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.roomSize, wallHeight, 0.5),
            wallMaterial
        );
        leftWall.position.set(
            offsetX + this.roomSize/2,
            wallHeight/2,
            offsetZ + this.roomSize/2 - hallwayWidth/2
        );
        room.add(leftWall);
        this.collidableObjects.push({
            position: leftWall.position.clone(),
            size: { x: this.roomSize, y: wallHeight, z: 0.5 },
            type: 'wall'
        });

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.roomSize, wallHeight, 0.5),
            wallMaterial
        );
        rightWall.position.set(
            offsetX + this.roomSize/2,
            wallHeight/2,
            offsetZ + this.roomSize/2 + hallwayWidth/2
        );
        room.add(rightWall);
        this.collidableObjects.push({
            position: rightWall.position.clone(),
            size: { x: this.roomSize, y: wallHeight, z: 0.5 },
            type: 'wall'
        });

        // Add misty fog effect (reduced density for better visibility)
        room.fog = new THREE.FogExp2(0x000000, 0.12);

        // Add brighter lighting
        const mainLight = new THREE.PointLight(0x2a2a2a, 0.7, 15);
        mainLight.position.set(
            offsetX + this.roomSize/2,
            wallHeight - 1,
            offsetZ + this.roomSize/2
        );
        room.add(mainLight);

        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0x202020, 0.2);
        room.add(ambientLight);

        // Add doors based on walking time
        if (this.walkTimer > 0) {
            // Regular room doors every 5 seconds (now water-style)
            if (Math.floor(this.walkTimer) % 5 === 0) {
                const waterDoorMaterial = new THREE.MeshLambertMaterial({
                    color: 0x00aaff,
                    transparent: true,
                    opacity: 0.8
                });
                const door = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 6, 0.3),
                    waterDoorMaterial
                );

                // Position door on one of the side walls
                const onLeftWall = Math.random() < 0.5;
                door.position.set(
                    offsetX + Math.random() * (this.roomSize - 4) + 2, // Random position along hallway
                    3, // Height
                    offsetZ + this.roomSize/2 + (onLeftWall ? -hallwayWidth/2 : hallwayWidth/2) // Left or right wall
                );
                door.rotation.y = onLeftWall ? Math.PI : 0; // Face into hallway
                
                door.userData = { 
                    type: 'water_door',
                    destination: 'random'
                };
                room.add(door);
                this.doors.push(door);

                // Add water door glow effect
                const doorLight = new THREE.PointLight(0x00ffff, 0.8, 5);
                doorLight.position.copy(door.position);
                room.add(doorLight);

                // Add water particles
                for (let i = 0; i < 5; i++) {
                    const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
                    const particleMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.6
                    });
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    const angle = (i / 5) * Math.PI * 2;
                    const radius = 1.5;
                    particle.position.set(
                        door.position.x + Math.cos(angle) * radius,
                        door.position.y + Math.sin(Date.now() * 0.001 + i),
                        door.position.z + Math.sin(angle) * radius
                    );
                    room.add(particle);
                }
            }

            // Teleport doors with 25% chance every 30 seconds (enhanced water effect)
            if (this.walkTimer >= 30 && Math.random() < 0.25) {
                const teleportDoorMaterial = new THREE.MeshLambertMaterial({
                    color: 0x00ff88,
                    transparent: true,
                    opacity: 0.9,
                    emissive: 0x00ff88,
                    emissiveIntensity: 0.5
                });
                const teleportDoor = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 6, 0.3),
                    teleportDoorMaterial
                );

                // Position teleport door on one of the side walls
                const onLeftWall = Math.random() < 0.5;
                teleportDoor.position.set(
                    offsetX + Math.random() * (this.roomSize - 4) + 2, // Random position along hallway
                    3, // Height
                    offsetZ + this.roomSize/2 + (onLeftWall ? -hallwayWidth/2 : hallwayWidth/2) // Left or right wall
                );
                teleportDoor.rotation.y = onLeftWall ? Math.PI : 0; // Face into hallway

                teleportDoor.userData = { 
                    type: 'teleport_door',
                    destination: 'random'
                };
                room.add(teleportDoor);
                this.doors.push(teleportDoor);

                // Enhanced glow effect
                const glow = new THREE.PointLight(0x00ff88, 1.2, 8);
                glow.position.copy(teleportDoor.position);
                room.add(glow);

                // Add more water particles for teleport door
                for (let i = 0; i < 8; i++) {
                    const particleGeometry = new THREE.SphereGeometry(0.15, 4, 4);
                    const particleMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ff88,
                        transparent: true,
                        opacity: 0.7
                    });
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = 2;
                    particle.position.set(
                        teleportDoor.position.x + Math.cos(angle) * radius,
                        teleportDoor.position.y + Math.sin(Date.now() * 0.001 + i) * 1.5,
                        teleportDoor.position.z + Math.sin(angle) * radius
                    );
                    room.add(particle);
                }
            }
        }

        this.scene.add(room);
        this.rooms.set(`${roomX},${roomZ}`, room);
    }

    addCollectibles(room, offsetX, offsetZ) {
        // Random chance to spawn collectibles
        for (let i = 0; i < 5; i++) {
            const totalRarity = this.itemTypes.reduce((sum, type) => sum + type.rarity, 0);
            const random = Math.random() * totalRarity;
            
            if (random < totalRarity) {
                let cumulative = 0;
                let selectedType = this.itemTypes[0];
                
                for (const itemType of this.itemTypes) {
                    cumulative += itemType.rarity;
                    if (random <= cumulative) {
                        selectedType = itemType;
                        break;
                    }
                }
                
                const x = offsetX + Math.random() * (this.roomSize - 4) + 2;
                const z = offsetZ + Math.random() * (this.roomSize - 4) + 2;
                
                // Check if position is clear of pillars
                let positionClear = true;
                for (const obj of this.collidableObjects) {
                    if (obj.type === 'pillar') {
                        const dist = Math.sqrt(
                            Math.pow(x - obj.position.x, 2) + 
                            Math.pow(z - obj.position.z, 2)
                        );
                        if (dist < 2) {
                            positionClear = false;
                            break;
                        }
                    }
                }
                
                if (positionClear) {
                    const collectibleMaterial = new THREE.MeshLambertMaterial({ color: selectedType.color });
                    const collectibleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                    
                    const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
                    collectible.position.set(x, 1, z);
                    collectible.userData = { 
                        type: 'collectible', 
                        collected: false,
                        itemType: selectedType
                    };
                    
                    room.add(collectible);
                    this.collectibles.push(collectible);
                }
            }
        }
    }

    // Collision detection
    checkCollision(newPosition) {
        for (const obj of this.collidableObjects) {
            const dx = Math.abs(newPosition.x - obj.position.x);
            const dz = Math.abs(newPosition.z - obj.position.z);
            
            if (dx < (obj.size.x/2 + this.player.radius) && 
                dz < (obj.size.z/2 + this.player.radius)) {
                return true;
            }
        }
        return false;
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW': this.controls.moveForward = true; break;
                case 'KeyS': this.controls.moveBackward = true; break;
                case 'KeyA': this.controls.moveLeft = true; break;
                case 'KeyD': this.controls.moveRight = true; break;
                case 'ShiftLeft': this.controls.sprint = true; break;
                case 'Space': 
                    this.controls.jump = true; 
                    event.preventDefault();
                    break;
                case 'KeyE':
                    this.collectNearbyItems();
                    break;
                case 'Digit1':
                    this.useItem('Energy Drink');
                    break;
                case 'Digit2':
                    this.useItem('Health Kit');
                    break;
                case 'Digit3':
                    this.useItem('Flashlight Battery');
                    break;
                case 'KeyQ':
                    this.dropOldestItem();
                    break;
                case 'KeyF':
                    const nearbyDoor = this.checkDoorInteraction();
                    if (nearbyDoor) {
                        this.enterDoor(nearbyDoor);
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW': this.controls.moveForward = false; break;
                case 'KeyS': this.controls.moveBackward = false; break;
                case 'KeyA': this.controls.moveLeft = false; break;
                case 'KeyD': this.controls.moveRight = false; break;
                case 'ShiftLeft': this.controls.sprint = false; break;
                case 'Space': this.controls.jump = false; break;
            }
        });

        // Mouse controls
        let isLocked = false;
        document.addEventListener('click', () => {
            if (!isLocked) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            isLocked = document.pointerLockElement === this.renderer.domElement;
        });

        document.addEventListener('mousemove', (event) => {
            if (isLocked) {
                this.player.rotation.y -= event.movementX * 0.002;
                this.player.rotation.x -= event.movementY * 0.002;
                this.player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.player.rotation.x));
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    collectNearbyItems() {
        const playerPos = this.player.position;
        
        this.collectibles.forEach((collectible, index) => {
            if (!collectible.userData.collected) {
                const distance = playerPos.distanceTo(collectible.position);
                if (distance < 3) {
                    // Check if inventory is full
                    if (this.inventory.length >= 5) {
                        this.showMessage(`Inventory full! (5/5) Drop items or use them first.`);
                        return;
                    }
                    
                    collectible.userData.collected = true;
                    collectible.visible = false;
                    
                    const itemType = collectible.userData.itemType;
                    this.inventory.push(itemType);
                    this.updateUI();
                    
                    // Show collection message with inventory count
                    this.showMessage(`Collected: ${itemType.name}! (${this.inventory.length}/5)`);
                }
            }
        });
    }

    useItem(itemName) {
        const itemIndex = this.inventory.findIndex(item => item.name === itemName);
        if (itemIndex !== -1) {
            const item = this.inventory[itemIndex];
            let used = false;
            
            switch(item.effect) {
                case 'energy':
                    if (this.player.energy < 100) {
                        this.player.energy = Math.min(100, this.player.energy + item.value);
                        used = true;
                        this.showMessage(`Used ${item.name}. Energy restored!`);
                    }
                    break;
                case 'health':
                    if (this.player.health < 100) {
                        this.player.health = Math.min(100, this.player.health + item.value);
                        used = true;
                        this.showMessage(`Used ${item.name}. Health restored!`);
                    }
                    break;
                case 'light':
                    // Temporarily increase lighting
                    this.scene.children.forEach(light => {
                        if (light.type === 'AmbientLight') {
                            light.intensity = 1.2;
                            setTimeout(() => {
                                light.intensity = 0.6;
                            }, 30000); // 30 seconds
                        }
                    });
                    used = true;
                    this.showMessage(`Used ${item.name}. Area is brighter!`);
                    break;
                default:
                    this.showMessage(`${item.name} - A mysterious item...`);
                    break;
            }
            
            if (used) {
                this.inventory.splice(itemIndex, 1);
                this.updateUI();
            }
        }
    }

    dropOldestItem() {
        if (this.inventory.length > 0) {
            const droppedItem = this.inventory.shift(); // Remove first (oldest) item
            this.showMessage(`Dropped: ${droppedItem.name}! (${this.inventory.length}/5)`);
            this.updateUI();
        } else {
            this.showMessage(`No items to drop!`);
        }
    }

    showMessage(text) {
        // Create temporary message display
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.background = 'rgba(0, 0, 0, 0.8)';
        messageDiv.style.color = '#ffff00';
        messageDiv.style.padding = '10px 20px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.fontFamily = 'Courier New, monospace';
        messageDiv.textContent = text;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 2000);
    }

    updateUI() {
        document.getElementById('itemCount').textContent = `Items: ${this.inventory.length}/5`;
        
        // Group items by type
        const itemCounts = {};
        this.inventory.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
        });
        
        document.getElementById('itemList').innerHTML = Object.entries(itemCounts)
            .map(([name, count]) => `<div>${name}: ${count}</div>`).join('');
            
        // Update stats
        const statsDiv = document.getElementById('stats') || this.createStatsDiv();
        const levelName = this.currentLevel === 0 ? 'Backrooms Level 0' : this.currentLevel === 1 ? 'Pool Rooms' : this.currentLevel === 2 ? 'The Office' : 'Dark Halls';
        const walkProgress = Math.min(30, this.walkTimer);
        const doorsStatus = this.hasWalkedEnough ? 'Available' : `Walk ${Math.ceil(30 - walkProgress)}s more`;
        
        statsDiv.innerHTML = `
            <div>Level: ${levelName}</div>
            <div>Health: ${Math.round(this.player.health)}/100</div>
            <div>Energy: ${Math.round(this.player.energy)}/100</div>
            <div>Walk Time: ${Math.round(walkProgress)}/30s</div>
            <div>Doors: ${doorsStatus}</div>
        `;
    }

    createStatsDiv() {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'stats';
        statsDiv.style.marginTop = '10px';
        statsDiv.style.padding = '10px';
        statsDiv.style.background = 'rgba(0, 0, 0, 0.7)';
        statsDiv.style.border = '2px solid #ffff00';
        statsDiv.style.borderRadius = '5px';
        document.getElementById('ui').appendChild(statsDiv);
        return statsDiv;
    }

    update(deltaTime) {
        // Update walking timer when moving in dark halls
        if (this.currentLevel === 3 && 
            (this.controls.moveForward || this.controls.moveBackward || 
             this.controls.moveLeft || this.controls.moveRight)) {
            this.walkTimer += deltaTime;
            // Update UI to show walking progress
            document.getElementById('walkTime').textContent = `Walk Time: ${Math.floor(this.walkTimer)}s`;
        }

        // Drain energy when sprinting
        if (this.controls.sprint && (this.controls.moveForward || this.controls.moveBackward || this.controls.moveLeft || this.controls.moveRight)) {
            this.player.energy = Math.max(0, this.player.energy - 15 * deltaTime);
        } else {
            this.player.energy = Math.min(100, this.player.energy + 5 * deltaTime);
        }

        // Movement
        const canSprint = this.player.energy > 10;
        const speed = (this.controls.sprint && canSprint) ? this.player.sprintSpeed : this.player.speed;
        
        // Create movement vector
        let moveX = 0;
        let moveZ = 0;
        
        if (this.controls.moveForward) moveZ -= 1;
        if (this.controls.moveBackward) moveZ += 1;
        if (this.controls.moveLeft) moveX -= 1;
        if (this.controls.moveRight) moveX += 1;
        
        // Track walking time for door requirement
        const isMoving = moveX !== 0 || moveZ !== 0;
        if (isMoving) {
            this.walkTimer += deltaTime;
            if (this.walkTimer >= 30 && !this.hasWalkedEnough) {
                this.hasWalkedEnough = true;
                this.showMessage('You have explored enough! Doors may now appear.');
            }
        }
        
        // Normalize diagonal movement
        if (moveX !== 0 || moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
        }
        
        // Apply speed and deltaTime
        moveX *= speed * deltaTime;
        moveZ *= speed * deltaTime;
        
        // Apply rotation to movement
        const cos = Math.cos(this.player.rotation.y);
        const sin = Math.sin(this.player.rotation.y);
        
        const worldMoveX = moveX * cos + moveZ * sin;
        const worldMoveZ = -moveX * sin + moveZ * cos;
        
        // Check collision before moving
        const newPosition = this.player.position.clone();
        newPosition.x += worldMoveX;
        newPosition.z += worldMoveZ;
        
        if (!this.checkCollision(newPosition)) {
            this.player.position.x += worldMoveX;
            this.player.position.z += worldMoveZ;
        }

        // Simple gravity and jumping
        if (this.controls.jump && this.player.onGround) {
            this.player.velocity.y = this.player.jumpPower;
            this.player.onGround = false;
        }

        this.player.velocity.y -= 25 * deltaTime; // Gravity
        this.player.position.y += this.player.velocity.y * deltaTime;

        if (this.player.position.y <= 1) {
            this.player.position.y = 1;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }

        // Update camera
        this.camera.position.copy(this.player.position);
        this.camera.rotation.copy(this.player.rotation);

        // Generate new rooms if needed
        this.generateRooms();

        // Animate collectibles
        this.animateCollectibles(deltaTime);
        
        // Check for door interactions
        this.checkDoorInteraction();
        
        // Update UI
        this.updateUI();
    }

    animateCollectibles(deltaTime) {
        this.collectibles.forEach(collectible => {
            if (!collectible.userData.collected) {
                collectible.rotation.y += deltaTime * 2;
                collectible.position.y = 1 + Math.sin(Date.now() * 0.005) * 0.2;
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 1/60; // Simplified delta time
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    generateItems(roomKey) {
        if (this.roomItems.has(roomKey)) return;
        
        this.roomItems.set(roomKey, []);
        
        // Generate fewer items - only attempt generation every other room check
        if (Math.random() < 0.3) { // Reduced from default probability
            for (const itemType of this.itemTypes) {
                if (Math.random() < itemType.rarity) {
                    const item = {
                        type: itemType.type,
                        name: itemType.name,
                        color: itemType.color,
                        effect: itemType.effect,
                        position: new THREE.Vector3(
                            (Math.random() - 0.5) * 18, // Keep within room bounds
                            1.5,
                            (Math.random() - 0.5) * 18
                        )
                    };
                    
                    // Create visual representation
                    const geometry = new THREE.SphereGeometry(0.3, 8, 6);
                    const material = new THREE.MeshBasicMaterial({ 
                        color: itemType.color,
                        transparent: true,
                        opacity: 0.8
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.copy(item.position);
                    mesh.userData = item;
                    
                    this.scene.add(mesh);
                    this.roomItems.get(roomKey).push(mesh);
                    this.collectibles.push(mesh);
                }
            }
        }
    }

    createDoor(room, offsetX, offsetZ, destination) {
        // Create door frame
        const doorFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 }); // Gray frame
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Darker gray door

        // Door frame
        const frameGeometry = new THREE.BoxGeometry(3, 8, 0.5);
        const doorFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial);
        
        // Door
        const doorGeometry = new THREE.BoxGeometry(2.5, 7, 0.3);
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        
        // Position door randomly on a wall
        const side = Math.floor(Math.random() * 4);
        let doorX, doorZ;
        
        switch(side) {
            case 0: // North wall
                doorX = offsetX + this.roomSize/2;
                doorZ = offsetZ + this.roomSize - 1;
                break;
            case 1: // South wall
                doorX = offsetX + this.roomSize/2;
                doorZ = offsetZ + 1;
                break;
            case 2: // East wall
                doorX = offsetX + this.roomSize - 1;
                doorZ = offsetZ + this.roomSize/2;
                break;
            case 3: // West wall
                doorX = offsetX + 1;
                doorZ = offsetZ + this.roomSize/2;
                break;
        }
        
        doorFrame.position.set(doorX, 4, doorZ);
        door.position.set(doorX, 3.5, doorZ);
        
        // Add glowing effect to make door visible
        const doorLight = new THREE.PointLight(0xff6600, 0.5, 10);
        doorLight.position.copy(door.position);
        doorLight.position.y += 2;
        
        room.add(doorFrame);
        room.add(door);
        room.add(doorLight);
        
        // Store door data for interaction
        const doorData = {
            position: door.position.clone(),
            destination: destination,
            mesh: door
        };
        
        this.doors.push(doorData);
    }

    checkDoorInteraction() {
        const playerPos = this.player.position;
        
        for (const door of this.doors) {
            // Get the actual door position from the mesh
            const doorPosition = door.position || door.mesh?.position;
            if (!doorPosition) continue;

            const distance = playerPos.distanceTo(doorPosition);
            if (distance < 3) {
                if (door.userData?.type === 'water_door') {
                    this.showMessage('Press F to enter a random level through the water door');
                } else if (door.userData?.type === 'teleport_door') {
                    this.showMessage('Press F to teleport to a random level');
                }
                return door;
            }
        }
        return null;
    }

    enterDoor(door) {
        if (door.userData.type === 'teleport_door' || door.userData.type === 'water_door') {
            // Select random level (excluding current level)
            const availableLevels = this.availableLevels.filter(level => level.id !== this.currentLevel);
            const randomLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)];
            this.currentLevel = randomLevel.id;
            this.showMessage(`Teleporting to ${randomLevel.name}...`);
        } else if (door.userData.destination === 'poolrooms') {
            this.currentLevel = 1;
            this.showMessage('Entering Pool Rooms...');
        } else if (door.userData.destination === 'backrooms') {
            this.currentLevel = 0;
            this.showMessage('Returning to Backrooms Level 0...');
        }
        
        // Clear current world
        this.clearWorld();
        
        // Reset player position
        this.player.position.set(25, 1, 25);
        
        // Reset walk timer for new level
        this.walkTimer = 0;
        this.hasWalkedEnough = false;
        
        // Generate new rooms for the new level
        this.generateRooms();
    }

    clearWorld() {
        // Remove all rooms
        this.rooms.forEach((room) => {
            this.scene.remove(room);
        });
        this.rooms.clear();
        
        // Clear arrays
        this.collectibles = [];
        this.collidableObjects = [];
        this.doors = [];
        this.roomItems.clear();
    }

    createWaterDoor(room, offsetX, offsetZ) {
        // Create a special water door that floats on the water surface
        const waterDoorFrameMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00aaff, 
            transparent: true, 
            opacity: 0.8 
        });
        const waterDoorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0066cc, 
            transparent: true, 
            opacity: 0.9 
        });

        // Door frame (floating on water)
        const frameGeometry = new THREE.BoxGeometry(3, 6, 0.3);
        const waterDoorFrame = new THREE.Mesh(frameGeometry, waterDoorFrameMaterial);
        
        // Door (floating on water)
        const doorGeometry = new THREE.BoxGeometry(2.5, 5.5, 0.2);
        const waterDoor = new THREE.Mesh(doorGeometry, waterDoorMaterial);
        
        // Position door randomly on water surface
        const doorX = offsetX + Math.random() * (this.roomSize - 10) + 5;
        const doorZ = offsetZ + Math.random() * (this.roomSize - 10) + 5;
        
        waterDoorFrame.position.set(doorX, 3, doorZ);
        waterDoor.position.set(doorX, 2.8, doorZ);
        
        // Add special glowing effect (blue/cyan glow)
        const waterDoorLight = new THREE.PointLight(0x00ffff, 1, 15);
        waterDoorLight.position.copy(waterDoor.position);
        waterDoorLight.position.y += 2;
        
        // Add particle-like effect with small spheres
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, 
                transparent: true, 
                opacity: 0.6 
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            const radius = 2;
            particle.position.set(
                doorX + Math.cos(angle) * radius,
                2 + Math.sin(Date.now() * 0.001 + i) * 0.5,
                doorZ + Math.sin(angle) * radius
            );
            
            room.add(particle);
        }
        
        room.add(waterDoorFrame);
        room.add(waterDoor);
        room.add(waterDoorLight);
        
        // Store water door data for interaction
        const waterDoorData = {
            position: waterDoor.position.clone(),
            destination: 'random',
            mesh: waterDoor,
            type: 'water'
        };
        
        this.doors.push(waterDoorData);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new BackroomsGame();
}); 