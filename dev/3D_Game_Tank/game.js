// Инициализация сцены, камеры и рендерера
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем лого "Igor Game Studio"
const logoDiv = document.createElement('div');
logoDiv.style.position = 'absolute';
logoDiv.style.top = '20px';
logoDiv.style.left = '0';
logoDiv.style.width = '100%';
logoDiv.style.textAlign = 'center';
logoDiv.style.color = 'white';
logoDiv.style.fontFamily = 'Arial, sans-serif';
logoDiv.style.fontSize = '24px';
logoDiv.style.textShadow = '2px 2px 4px black';
logoDiv.textContent = 'Igor Game Studio';
document.body.appendChild(logoDiv);

// Освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Загрузка текстур
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('https://threejs.org/examples/textures/grass.jpg');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);

// Земля с травой
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ map: grassTexture })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Деревья (просто цилиндры + конусы)
function createTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 2),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.set(x, 1, z);
    
    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x00aa00 })
    );
    leaves.position.set(x, 3.5, z);
    
    scene.add(trunk);
    scene.add(leaves);
}

// Создаём деревья в случайных местах
for (let i = 0; i < 20; i++) {
    createTree(
        Math.random() * 80 - 40,
        Math.random() * 80 - 40
    );
}

// Танк (корпус + башня + пушка)
const tank = new THREE.Group();

// Корпус танка
const body = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x5555ff })
);
body.position.y = 1.5;
tank.add(body);

// Башня
const turret = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.8, 32),
    new THREE.MeshStandardMaterial({ color: 0x3333aa })
);
turret.position.y = 2.3;
turret.rotation.x = Math.PI / 2;
tank.add(turret);

// Пушка
const gun = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 2, 32),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
);
gun.position.y = 2.3;
gun.position.z = -1;
gun.rotation.x = Math.PI / 2;
tank.add(gun);

scene.add(tank);

// Камера следует за танком
camera.position.set(0, 5, -10);
camera.lookAt(tank.position);

// Массив пуль
const bullets = [];
const bulletSpeed = 0.5;

// Управление
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// Вражеские танки
const enemies = [];
const enemySpeed = 0.05;

function createEnemy() {
    const enemy = new THREE.Group();
    enemy.userData.health = 5; // Добавляем здоровье врагу

    // Корпус
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 4),
        new THREE.MeshStandardMaterial({ color: 0xff5555 })
    );
    body.position.y = 1.5;
    enemy.add(body);

    // Башня
    const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.8, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa3333 })
    );
    turret.position.y = 2.3;
    turret.rotation.x = Math.PI / 2;
    enemy.add(turret);

    // Пушка
    const gun = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 2, 32),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    gun.position.y = 2.3;
    gun.position.z = -1;
    gun.rotation.x = Math.PI / 2;
    enemy.add(gun);

    // Случайная позиция
    enemy.position.x = Math.random() * 80 - 40;
    enemy.position.z = Math.random() * 80 - 40;
    enemy.rotation.y = Math.random() * Math.PI * 2;

    scene.add(enemy);
    enemies.push(enemy);
}

// Взрыв при уничтожении
function createExplosion(position) {
    const explosion = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 })
    );
    explosion.position.copy(position);
    scene.add(explosion);

    // Анимация взрыва
    let scale = 1;
    const animateExplosion = () => {
        scale += 0.1;
        explosion.scale.set(scale, scale, scale);
        explosion.material.opacity -= 0.05;

        if (explosion.material.opacity > 0) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
        }
    };
    animateExplosion();
}

// Проверка столкновений пуль с врагами
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.position.distanceTo(enemy.position) < 2) {
                // Уменьшаем здоровье врага
                enemy.userData.health--;
                
                // Меняем цвет при попадании (от красного к чёрному)
                const intensity = enemy.userData.health / 5;
                enemy.children[0].material.color.setRGB(intensity, 0, 0);
                
                // Удаляем пулю
                scene.remove(bullet);
                bullets.splice(bulletIndex, 1);
                
                // Если здоровье закончилось
                if (enemy.userData.health <= 0) {
                    createExplosion(enemy.position);
                    scene.remove(enemy);
                    enemies.splice(enemyIndex, 1);
                    createEnemy(); // Создаём нового врага
                }
            }
        });
    });
}

// Игровой цикл
function gameLoop() {
    requestAnimationFrame(gameLoop);

    // Движение танка
    if (keys['KeyW']) tank.position.z -= 0.1 * Math.cos(tank.rotation.y);
    if (keys['KeyS']) tank.position.z += 0.1 * Math.cos(tank.rotation.y);
    if (keys['KeyW']) tank.position.x -= 0.1 * Math.sin(tank.rotation.y);
    if (keys['KeyS']) tank.position.x += 0.1 * Math.sin(tank.rotation.y);
    if (keys['KeyA']) tank.rotation.y += 0.03;
    if (keys['KeyD']) tank.rotation.y -= 0.03;

    // Стрельба (Пробел)
    if (keys['Space']) {
        keys['Space'] = false;
        const bullet = new THREE.Mesh(
            new THREE.SphereGeometry(0.2),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        bullet.position.copy(tank.position);
        bullet.position.y = 2.3;
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(tank.quaternion);
        bullet.userData.velocity = direction.multiplyScalar(bulletSpeed);
        
        scene.add(bullet);
        bullets.push(bullet);
    }

    // Движение пуль
    bullets.forEach((bullet, index) => {
        bullet.position.add(bullet.userData.velocity);
        
        if (bullet.position.distanceTo(tank.position) > 30) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });

    // Движение врагов (просто крутятся вокруг своей оси)
    enemies.forEach(enemy => {
        enemy.rotation.y += 0.01;
    });

    // Проверка столкновений
    checkCollisions();

    // Камера
    camera.position.x = tank.position.x;
    camera.position.z = tank.position.z - 10;
    camera.lookAt(tank.position);

    renderer.render(scene, camera);
}

gameLoop();
// Реакция на изменение размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});