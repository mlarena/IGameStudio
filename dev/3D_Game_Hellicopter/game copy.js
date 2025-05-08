// Основные переменные
let scene, camera, renderer, helicopter, rotor, tailRotor, controls;
let terrain, mountains = [], trees = [], clouds = [];
let keys = {};
let speed = 0, altitude = 0, pitch = 0, roll = 0;
let gameOver = false;
let clock = new THREE.Clock();
let river;

// Инициализация сцены
function init() {
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Небесно-голубой
    
    // Создание камеры
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, -20);
    
    // Создание рендерера
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(hemisphereLight);
    
    // Создание вертолёта
    createHelicopter();
    
    // Создание ландшафта
    createTerrain();
    createMountains();
    createRiver();
    createTrees();
    createClouds();
    
    // Обработчики событий
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    
    // Начало анимации
    animate();
}

// Создание вертолёта
function createHelicopter() {
    const helicopterGroup = new THREE.Group();
    
    // Кабина (основной корпус)
    const cabinGeometry = new THREE.BoxGeometry(3, 1.5, 5);
    const cabinMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x555555,
        flatShading: true
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    helicopterGroup.add(cabin);
    
    // Хвостовая балка
    const tailGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(0, 0, -3);
    tail.castShadow = true;
    helicopterGroup.add(tail);
    
    // Хвостовой винт
    const tailRotorGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.2);
    const tailRotorMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    tailRotor = new THREE.Mesh(tailRotorGeometry, tailRotorMaterial);
    tailRotor.position.set(0, 0, -6.5);
    tailRotor.castShadow = true;
    helicopterGroup.add(tailRotor);
    
    // Основной ротор
    const rotorGeometry = new THREE.BoxGeometry(8, 0.2, 0.5);
    const rotorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(0, 1.5, 0);
    rotor.castShadow = true;
    helicopterGroup.add(rotor);
    
    // Шасси
    const landingGearGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const landingGearMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    const frontGear = new THREE.Mesh(landingGearGeometry, landingGearMaterial);
    frontGear.rotation.x = Math.PI / 2;
    frontGear.position.set(0, -1, 1.5);
    frontGear.castShadow = true;
    helicopterGroup.add(frontGear);
    
    const leftGear = new THREE.Mesh(landingGearGeometry, landingGearMaterial);
    leftGear.rotation.x = Math.PI / 2;
    leftGear.position.set(-1, -1, -1);
    leftGear.castShadow = true;
    helicopterGroup.add(leftGear);
    
    const rightGear = new THREE.Mesh(landingGearGeometry, landingGearMaterial);
    rightGear.rotation.x = Math.PI / 2;
    rightGear.position.set(1, -1, -1);
    rightGear.castShadow = true;
    helicopterGroup.add(rightGear);
    
    helicopterGroup.position.set(0, 5, 0);
    helicopter = helicopterGroup;
    scene.add(helicopter);
}

// Создание ландшафта
function createTerrain() {
    const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a5f0b,
        flatShading: true
    });
    
    // Деформируем плоскость для создания неровностей
    const positions = terrainGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        // Добавляем небольшие неровности
        const distanceToCenter = Math.sqrt(x*x + y*y);
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 5;
        
        positions.setZ(i, noise);
    }
    
    terrainGeometry.computeVertexNormals();
    
    terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
}

// Создание гор
function createMountains() {
    const mountainGeometry = new THREE.ConeGeometry(30, 60, 32);
    const mountainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6b5b4d,
        flatShading: true
    });
    
    // Создаём несколько гор
    for (let i = 0; i < 10; i++) {
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Случайное позиционирование
        const x = (Math.random() - 0.5) * 800;
        const z = (Math.random() - 0.5) * 800;
        mountain.position.set(x, 30, z);
        
        // Случайный масштаб
        const scale = 0.5 + Math.random() * 1.5;
        mountain.scale.set(scale, scale, scale);
        
        // Случайный поворот
        mountain.rotation.y = Math.random() * Math.PI * 2;
        
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        
        scene.add(mountain);
        mountains.push(mountain);
    }
}

// Создание реки
function createRiver() {
    const riverGeometry = new THREE.PlaneGeometry(1000, 30, 10, 10);
    const riverMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a7ebd,
        transparent: true,
        opacity: 0.8,
        flatShading: true
    });
    
    // Деформируем реку
    const positions = riverGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        positions.setZ(i, Math.sin(x * 0.05) * 2);
    }
    
    riverGeometry.computeVertexNormals();
    
    river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.y = 0.1; // Немного выше земли
    river.receiveShadow = true;
    scene.add(river);
}

// Создание деревьев
function createTrees() {
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5e2c04 });
    
    const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    
    for (let i = 0; i < 100; i++) {
        const tree = new THREE.Group();
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        tree.add(trunk);
        
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 6;
        leaves.castShadow = true;
        tree.add(leaves);
        
        // Случайное позиционирование, избегая гор
        let x, z;
        let validPosition = false;
        
        while (!validPosition) {
            x = (Math.random() - 0.5) * 800;
            z = (Math.random() - 0.5) * 800;
            
            // Проверяем, не слишком ли близко к горе
            validPosition = true;
            for (const mountain of mountains) {
                const distance = Math.sqrt(
                    Math.pow(x - mountain.position.x, 2) + 
                    Math.pow(z - mountain.position.z, 2)
                );
                
                if (distance < mountain.scale.x * 30 + 10) {
                    validPosition = false;
                    break;
                }
            }
            
            // Также проверяем, чтобы не было слишком близко к реке
            if (Math.abs(z) < 20 && Math.abs(x) < 500) {
                validPosition = false;
            }
        }
        
        tree.position.set(x, 0, z);
        tree.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(tree);
        trees.push(tree);
    }
}

// Создание облаков
function createClouds() {
    const cloudGeometry = new THREE.SphereGeometry(5, 8, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    for (let i = 0; i < 20; i++) {
        const cloud = new THREE.Group();
        
        // Облако состоит из нескольких сфер
        for (let j = 0; j < 3 + Math.floor(Math.random() * 3); j++) {
            const part = new THREE.Mesh(cloudGeometry, cloudMaterial);
            part.position.set(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 8
            );
            part.scale.set(
                0.5 + Math.random(),
                0.5 + Math.random(),
                0.5 + Math.random()
            );
            cloud.add(part);
        }
        
        const x = (Math.random() - 0.5) * 1000;
        const y = 50 + Math.random() * 50;
        const z = (Math.random() - 0.5) * 1000;
        cloud.position.set(x, y, z);
        
        scene.add(cloud);
        clouds.push(cloud);
    }
}

// Обработка нажатия клавиш
function onKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
    
    // Обработка стрелок (для старых браузеров)
    if (event.key === 'ArrowUp') keys['arrowup'] = true;
    if (event.key === 'ArrowDown') keys['arrowdown'] = true;
    if (event.key === 'ArrowLeft') keys['arrowleft'] = true;
    if (event.key === 'ArrowRight') keys['arrowright'] = true;
    
    // Сброс позиции
    if (event.key.toLowerCase() === 'r') {
        resetPosition();
    }
    
    // Перезапуск игры
    if (gameOver && event.key === ' ') {
        resetGame();
    }
}

function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
    
    // Обработка стрелок (для старых браузеров)
    if (event.key === 'ArrowUp') keys['arrowup'] = false;
    if (event.key === 'ArrowDown') keys['arrowdown'] = false;
    if (event.key === 'ArrowLeft') keys['arrowleft'] = false;
    if (event.key === 'ArrowRight') keys['arrowright'] = false;
}

// Сброс позиции вертолёта
function resetPosition() {
    helicopter.position.set(0, 5, 0);
    helicopter.rotation.set(0, 0, 0);
    speed = 0;
    pitch = 0;
    roll = 0;
}

// Перезапуск игры
function resetGame() {
    gameOver = false;
    document.getElementById('game-over').style.display = 'none';
    resetPosition();
}

// Проверка столкновений
function checkCollisions() {
    if (gameOver) return;
    
    // Проверка высоты
    if (helicopter.position.y < 0) {
        crash();
        return;
    }
    
    // Проверка столкновения с горами
    for (const mountain of mountains) {
        const distance = helicopter.position.distanceTo(mountain.position);
        const minDistance = mountain.scale.x * 30 + 5; // Примерный радиус горы
        
        if (distance < minDistance) {
            // Проверяем высоту столкновения
            const relativeHeight = helicopter.position.y - mountain.position.y;
            if (relativeHeight < mountain.scale.y * 60 / 2 + 2) {
                crash();
                return;
            }
        }
    }
    
    // Проверка столкновения с деревьями
    for (const tree of trees) {
        const distance = helicopter.position.distanceTo(tree.position);
        const minDistance = 3 + tree.scale.y * 2; // Примерный радиус дерева
        
        if (distance < minDistance && helicopter.position.y < tree.scale.y * 6 + 2) {
            crash();
            return;
        }
    }
}

// Обработка аварии
function crash() {
    gameOver = true;
    document.getElementById('game-over').style.display = 'block';
}

// Обновление элементов управления
function updateControls(delta) {
    if (gameOver) return;
    
    // Управление движением
    const acceleration = 5 * delta;
    const rotationSpeed = 1 * delta;
    const liftSpeed = 3 * delta;
    const turnSpeed = 1.5 * delta;
    
    // Вперёд (W/Стрелка вверх)
    if (keys['w'] || keys['arrowup']) {
        speed += acceleration;
        pitch = THREE.MathUtils.lerp(pitch, -0.2, 0.1);
    } 
    // Назад (S/Стрелка вниз)
    else if (keys['s'] || keys['arrowdown']) {
        speed -= acceleration;
        pitch = THREE.MathUtils.lerp(pitch, 0.2, 0.1);
    } 
    else {
        speed = THREE.MathUtils.lerp(speed, 0, 0.05);
        pitch = THREE.MathUtils.lerp(pitch, 0, 0.1);
    }
    
    // Поворот влево (A/Стрелка влево)
    if (keys['a'] || keys['arrowleft']) {
        helicopter.rotation.y += turnSpeed;
        helicopter.rotation.z = THREE.MathUtils.lerp(helicopter.rotation.z, 0.2, 0.1);
        roll = THREE.MathUtils.lerp(roll, -0.1, 0.1);
    } 
    // Поворот вправо (D/Стрелка вправо)
    else if (keys['d'] || keys['arrowright']) {
        helicopter.rotation.y -= turnSpeed;
        helicopter.rotation.z = THREE.MathUtils.lerp(helicopter.rotation.z, -0.2, 0.1);
        roll = THREE.MathUtils.lerp(roll, 0.1, 0.1);
    } 
    else {
        helicopter.rotation.z = THREE.MathUtils.lerp(helicopter.rotation.z, 0, 0.1);
        roll = THREE.MathUtils.lerp(roll, 0, 0.1);
    }
    
    // Вверх/вниз (Q/E)
    if (keys['q']) {
        altitude += liftSpeed;
    } else if (keys['e']) {
        altitude -= liftSpeed;
    }
    
    // Ограничение скорости
    speed = THREE.MathUtils.clamp(speed, -20, 40);
    altitude = THREE.MathUtils.clamp(altitude, -5, 10);
    
    // Применение движения
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(helicopter.quaternion);
    forward.multiplyScalar(speed * delta);
    
    helicopter.position.add(forward);
    helicopter.position.y += altitude * delta;
    
    // Применение наклона
    helicopter.rotation.x = pitch;
    
    // Вращение лопастей
    rotor.rotation.y += delta * 20 * (1 + Math.abs(speed) / 10);
    tailRotor.rotation.x += delta * 40 * (1 + Math.abs(speed) / 10);
    
    // Обновление камеры (слежение за вертолётом)
    const cameraOffset = new THREE.Vector3(0, 5, -15);
    cameraOffset.applyQuaternion(helicopter.quaternion);
    camera.position.copy(helicopter.position).add(cameraOffset);
    camera.lookAt(helicopter.position);
    
    // Обновление UI
    document.getElementById('speed-value').textContent = Math.abs(Math.round(speed * 10));
    document.getElementById('altitude-value').textContent = Math.round(helicopter.position.y);
}

// Обработка изменения размера окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Основной цикл анимации
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    updateControls(delta);
    checkCollisions();
    
    renderer.render(scene, camera);
}

// Запуск игры
init();