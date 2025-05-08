// Основные переменные
let scene, camera, renderer, helicopter, rotor, tailRotor;
let terrain, mountains = [], trees = [], clouds = [], rockets = [], explosions = [];
let keys = {};
let speed = 0, altitude = 0, pitch = 0, roll = 0;
let gameOver = false;
let clock = new THREE.Clock();
let river;
let lastShotTime = 0;
const shotDelay = 500; // Задержка между выстрелами в мс
let ammo = Infinity; // Количество ракет (Infinity - бесконечно)

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
    window.addEventListener('keypress', onKeyPress);
    
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    
    // Обновление счетчика боеприпасов
    updateAmmoCounter();
    
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

// Создание ракеты
function createRocket() {
    if (ammo <= 0) return; // Проверка боеприпасов
    const now = Date.now();
    if (now - lastShotTime < shotDelay) return; // Проверка задержки
    
    lastShotTime = now;
    if (ammo !== Infinity) ammo--; // Уменьшаем боезапас, если он не бесконечный
    updateAmmoCounter();
    
    const rocketGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const rocketMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    
    // Позиционируем ракету перед вертолетом
    rocket.position.copy(helicopter.position);
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(helicopter.quaternion);
    rocket.position.add(forward.multiplyScalar(3));
    
    // Направление ракеты совпадает с направлением вертолета
    rocket.quaternion.copy(helicopter.quaternion);
    rocket.rotation.x += Math.PI / 2; // Поворачиваем, чтобы ракета летела вперед
    
    // Добавляем скорость вертолета к ракете
    const rocketSpeed = speed * 0.5 + 50; // Базовая скорость + часть скорости вертолета
    
    scene.add(rocket);
    rockets.push({
        mesh: rocket,
        speed: rocketSpeed,
        direction: forward,
        time: 0,
        maxTime: 3000 // Время жизни ракеты в мс
    });
}

// Создание взрыва
function createExplosion(position) {
    const particles = 50;
    const explosionGroup = new THREE.Group();
    
    for (let i = 0; i < particles; i++) {
        const size = 0.2 + Math.random() * 0.3;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(
                0.8 + Math.random() * 0.2,
                0.2 + Math.random() * 0.3,
                Math.random() * 0.2
            )
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Случайное направление
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        
        particle.userData = {
            direction: new THREE.Vector3(
                Math.sin(angle1) * Math.cos(angle2),
                Math.sin(angle1) * Math.sin(angle2),
                Math.cos(angle1)
            ).multiplyScalar(speed),
            lifetime: 0,
            maxLifetime: 1000 + Math.random() * 500 // Время жизни частицы
        };
        
        explosionGroup.add(particle);
    }
    
    scene.add(explosionGroup);
    explosions.push({
        group: explosionGroup,
        time: 0
    });
}

// Обновление счетчика боеприпасов
function updateAmmoCounter() {
    document.getElementById('ammo-value').textContent = ammo === Infinity ? '∞' : ammo;
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

function onKeyPress(event) {
    // Стрельба пробелом
    if (event.key === ' ' && !gameOver) {
        createRocket();
    }
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
    
    // Удаляем все ракеты и взрывы
    rockets.forEach(rocket => scene.remove(rocket.mesh));
    explosions.forEach(explosion => scene.remove(explosion.group));
    rockets = [];
    explosions = [];
    
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

// Проверка столкновений ракеты
function checkRocketCollision(position) {
    // Проверка столкновения с горами
    for (const mountain of mountains) {
        const distance = position.distanceTo(mountain.position);
        const minDistance = mountain.scale.x * 30;
        
        if (distance < minDistance) {
            const relativeHeight = position.y - mountain.position.y;
            if (relativeHeight < mountain.scale.y * 60 / 2) {
                return true;
            }
        }
    }
    
    // Проверка столкновения с деревьями
    for (const tree of trees) {
        const distance = position.distanceTo(tree.position);
        const minDistance = 3 + tree.scale.y * 2;
        
        if (distance < minDistance && position.y < tree.scale.y * 6 + 2) {
            return true;
        }
    }
    
    // Проверка столкновения с землей
    if (position.y < 0) {
        return true;
    }
    
    return false;
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

// Обновление ракет и взрывов
function updateRocketsAndExplosions(delta) {
    const deltaMs = delta * 1000; // Переводим в миллисекунды
    
    // Обновление ракет
    for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.time += deltaMs;
        
        // Удаляем старые ракеты
        if (rocket.time > rocket.maxTime) {
            scene.remove(rocket.mesh);
            rockets.splice(i, 1);
            continue;
        }
        
        // Движение ракеты
        const moveDistance = rocket.speed * delta;
        rocket.mesh.position.add(rocket.direction.clone().multiplyScalar(moveDistance));
        
        // Проверка столкновений
        if (checkRocketCollision(rocket.mesh.position)) {
            createExplosion(rocket.mesh.position);
            scene.remove(rocket.mesh);
            rockets.splice(i, 1);
        }
    }
    
    // Обновление взрывов
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.time += deltaMs;
        
        // Удаляем старые взрывы
        if (explosion.time > 1500) { // Взрыв длится 1.5 секунды
            scene.remove(explosion.group);
            explosions.splice(i, 1);
            continue;
        }
        
        // Анимация частиц взрыва
        explosion.group.children.forEach(particle => {
            particle.userData.lifetime += deltaMs;
            const progress = particle.userData.lifetime / particle.userData.maxLifetime;
            
            // Движение частицы
            particle.position.add(particle.userData.direction.clone().multiplyScalar(delta));
            
            // Уменьшение размера
            particle.scale.setScalar(1 - progress);
            
            // Изменение прозрачности
            particle.material.opacity = 1 - progress;
        });
    }
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
    updateRocketsAndExplosions(delta);
    
    renderer.render(scene, camera);
}

// Запуск игры
init();