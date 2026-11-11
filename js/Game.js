/**
 * ============================================================================
 * FILE: js/Game.js
 * MÔ TẢ: Định nghĩa lớp Game đóng vai trò là Bộ điều khiển trung tâm (Game Engine).
 *        Đã nâng cấp hỗ trợ đa nền tảng:
 *        - PC: Bàn phím WASD / Mũi tên + Chuột.
 *        - Mobile / Tablet: Hệ thống 2 Cần gạt ảo cảm ứng đa điểm (Virtual Joysticks)
 *          kết hợp cơ chế Smart Auto-Aim tự động khóa mục tiêu gần nhất.
 * TÍNH CHẤT HƯỚNG ĐỐI TƯỢNG & MẪU THIẾT KẾ (DESIGN PATTERNS) ĐỂ BÁO CÁO:
 * 1. Tính Đóng Gói & Hợp Thành (Encapsulation & Composition):
 *    - Lớp `Game` chứa và điều phối các đối tượng thành phần: `Player`, mảng `enemies`,
 *      mảng `projectiles`, mảng `particles`, mảng `gems`, mảng `coins` và `SoundManager`.
 * 2. Mẫu Thiết Kế Trạng Thái (State Pattern):
 *    - Quản lý 5 trạng thái tách biệt thông qua thuộc tính `this.state`:
 *      `MENU`, `PLAYING`, `LEVEL_UP`, `SHOP`, `GAME_OVER`.
 * 3. Lưu Trữ Bền Vững (Data Persistence với Web Storage API):
 *    - Đọc và ghi Điểm cao nhất (`highScore`), Tổng số vàng (`totalGold`), cấp độ nâng cấp
 *      vĩnh viễn (`upgrades`) và trang phục (`selectedSkin`) vào `localStorage`.
 * ============================================================================
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Khởi tạo bộ quản lý âm thanh Web Audio API (từ js/audio.js)
        this.sound = new SoundManager();

        // Định nghĩa các trạng thái của Game (State Pattern)
        this.STATES = {
            MENU: 'MENU',
            PLAYING: 'PLAYING',
            LEVEL_UP: 'LEVEL_UP',
            SHOP: 'SHOP',
            GAME_OVER: 'GAME_OVER'
        };
        this.state = this.STATES.MENU;

        // Cờ bật/tắt chế độ Debug báo cáo và Tự động bắn
        this.debugMode = false;
        this.autoFire = true;

        // Trạng thái bàn phím và chuột trên PC (được cập nhật từ js/main.js)
        this.keys = {};
        this.mouse = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            isDown: false
        };

        // Tự động nhận diện thiết bị cảm ứng hoặc màn hình nhỏ để kích hoạt Virtual Joystick
        const isTouchCapable =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.innerWidth <= 900;

        this.touchInput = {
            isTouchDevice: isTouchCapable,
            // Cần gạt bên trái: Điều khiển di chuyển nhân vật (Movement Joystick)
            moveJoystick: {
                active: false,
                touchId: null,
                baseX: 0,
                baseY: 0,
                stickX: 0,
                stickY: 0,
                vx: 0,
                vy: 0,
                maxRadius: 55
            },
            // Cần gạt bên phải: Điều khiển hướng ngắm bắn (Aim & Shoot Joystick)
            aimJoystick: {
                active: false,
                touchId: null,
                baseX: 0,
                baseY: 0,
                stickX: 0,
                stickY: 0,
                vx: 0,
                vy: 0,
                angle: 0,
                maxRadius: 55
            }
        };

        this.resizeCanvas();

        // Khởi tạo và đọc dữ liệu đã lưu từ localStorage
        this.storageKey = 'CYBER_SURVIVOR_SAVE_DATA_V1';
        this.saveData = this.loadSaveData();

        // Danh sách cấu hình Nâng cấp chỉ số vĩnh viễn trong Cửa hàng (Shop)
        this.shopUpgradeConfig = [
            { id: 'damage', name: 'Lõi Sát Thương', desc: '+6 Sát thương đạn mỗi cấp', baseCost: 50, maxLevel: 10 },
            { id: 'maxHp', name: 'Giáp Nano Sinh Học', desc: '+25 Máu tối đa mỗi cấp', baseCost: 40, maxLevel: 10 },
            { id: 'speed', name: 'Động Cơ Phản Lực', desc: '+18 Tốc độ chạy mỗi cấp', baseCost: 45, maxLevel: 8 },
            { id: 'fireRate', name: 'Bộ Nạp Siêu Tốc', desc: 'Tăng tốc độ bắn mỗi cấp', baseCost: 65, maxLevel: 8 },
            { id: 'magnet', name: 'Từ Trường Hút Ngọc', desc: '+30 Bán kính hút vật phẩm', baseCost: 35, maxLevel: 8 }
        ];

        // Danh sách Trang phục Neon (Skins) trong Cửa hàng
        this.skinConfig = [
            { id: 'cyan', name: 'Cyber Cyan (Mặc định)', color: '#00f3ff', cost: 0 },
            { id: 'emerald', name: 'Matrix Emerald', color: '#00ff66', cost: 120 },
            { id: 'crimson', name: 'Crimson Overdrive', color: '#ff0055', cost: 200 },
            { id: 'solar', name: 'Solar Gold', color: '#ffaa00', cost: 300 },
            { id: 'violet', name: 'Plasma Violet', color: '#d946ef', cost: 450 }
        ];

        // Khởi tạo các mảng chứa đối tượng thực thể trong trận đấu
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.gems = [];
        this.coins = [];

        // Bộ đếm thời gian và điểm số trong trận đấu
        this.score = 0;
        this.survivalTime = 0;
        this.enemySpawnTimer = 0;
        this.bossSpawnInterval = 30; // Boss xuất hiện định kỳ mỗi 30 giây theo yêu cầu đề bài
        this.bossTimer = this.bossSpawnInterval;
        this.screenShakeTimer = 0;

        // Biến đo tốc độ khung hình (FPS) phục vụ bảng thông số Debug Mode
        this.lastFrameTime = performance.now();
        this.fps = 60;
        this.frameTimeMs = 16.6;
        this.fpsUpdateTimer = 0;

        // Cập nhật giao diện Menu ban đầu
        this.updateMenuUI();
    }

    /**
     * Bắt đầu khởi chạy vòng lặp thời gian thực của Game bằng requestAnimationFrame
     */
    start() {
        this.lastFrameTime = performance.now();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Đặt lại trạng thái 2 cần gạt cảm ứng khi tạm dừng hoặc chuyển màn hình
     */
    resetTouchJoysticks() {
        this.touchInput.moveJoystick.active = false;
        this.touchInput.moveJoystick.touchId = null;
        this.touchInput.moveJoystick.vx = 0;
        this.touchInput.moveJoystick.vy = 0;

        this.touchInput.aimJoystick.active = false;
        this.touchInput.aimJoystick.touchId = null;
        this.touchInput.aimJoystick.vx = 0;
        this.touchInput.aimJoystick.vy = 0;
    }

    /**
     * Đọc dữ liệu đã lưu từ localStorage của trình duyệt.
     * Nếu người chơi mở game lần đầu tiên thì khởi tạo bộ dữ liệu mặc định.
     */
    loadSaveData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    highScore: parsed.highScore || 0,
                    totalGold: parsed.totalGold || 0,
                    upgrades: {
                        damage: parsed.upgrades?.damage || 0,
                        maxHp: parsed.upgrades?.maxHp || 0,
                        speed: parsed.upgrades?.speed || 0,
                        fireRate: parsed.upgrades?.fireRate || 0,
                        magnet: parsed.upgrades?.magnet || 0
                    },
                    unlockedSkins: parsed.unlockedSkins || ['cyan'],
                    selectedSkin: parsed.selectedSkin || 'cyan'
                };
            }
        } catch (e) {
            console.warn('Không thể đọc localStorage, sử dụng dữ liệu mặc định:', e);
        }

        return {
            highScore: 0,
            totalGold: 100, // Tặng sẵn 100 vàng khởi đầu để dễ demo Cửa hàng khi bảo vệ
            upgrades: { damage: 0, maxHp: 0, speed: 0, fireRate: 0, magnet: 0 },
            unlockedSkins: ['cyan'],
            selectedSkin: 'cyan'
        };
    }

    /**
     * Ghi dữ liệu hiện tại (Điểm cao nhất, Tổng vàng, Nâng cấp, Skin) vào localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.saveData));
        } catch (e) {
            console.warn('Không thể ghi vào localStorage:', e);
        }
    }

    /**
     * Tính toán tổng chỉ số cộng thêm từ các nâng cấp vĩnh viễn đã mua trong Shop
     */
    getPermanentBonuses() {
        const u = this.saveData.upgrades;
        return {
            damageBonus: u.damage * 6,
            hpBonus: u.maxHp * 25,
            speedBonus: u.speed * 18,
            fireRateBonus: u.fireRate * 0.022,
            magnetBonus: u.magnet * 30
        };
    }

    /**
     * Lấy mã màu HEX của trang phục nhân vật đang được trang bị
     */
    getSelectedSkinColor() {
        const skin = this.skinConfig.find((s) => s.id === this.saveData.selectedSkin);
        return skin ? skin.color : '#00f3ff';
    }

    /**
     * Tự động điều chỉnh độ phân giải Canvas khớp với kích thước cửa sổ trình duyệt
     * và kiểm tra lại kích thước màn hình để bật giao diện Joystick cho màn hình nhỏ
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.touchInput && window.innerWidth <= 900) {
            this.touchInput.isTouchDevice = true;
        }
    }

    /**
     * Bật / Tắt chế độ Debug Mode (Phím tắt F hoặc nút bấm góc trên phải)
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        const btn = document.getElementById('btnToggleDebug');
        const panel = document.getElementById('debugPanel');
        btn.classList.toggle('active-debug', this.debugMode);
        panel.style.display = this.debugMode ? 'block' : 'none';
    }

    /**
     * Chuyển đổi giữa các trạng thái của Game (State Pattern: MENU, PLAYING, LEVEL_UP, SHOP, GAME_OVER)
     * @param {string} newState - Trạng thái mới cần chuyển sang
     */
    changeState(newState) {
        this.state = newState;

        if (newState !== this.STATES.PLAYING) {
            this.resetTouchJoysticks();
        }

        // Ẩn tất cả các màn hình Modal trước
        document.getElementById('menuScreen').classList.remove('active');
        document.getElementById('levelUpScreen').classList.remove('active');
        document.getElementById('shopScreen').classList.remove('active');
        document.getElementById('gameOverScreen').classList.remove('active');

        // Hiển thị màn hình tương ứng với trạng thái mới
        if (newState === this.STATES.MENU) {
            document.getElementById('hudTop').style.display = 'none';
            document.getElementById('menuScreen').classList.add('active');
            this.updateMenuUI();
        } else if (newState === this.STATES.PLAYING) {
            document.getElementById('hudTop').style.display = 'flex';
        } else if (newState === this.STATES.LEVEL_UP) {
            document.getElementById('hudTop').style.display = 'flex';
            document.getElementById('levelUpScreen').classList.add('active');
        } else if (newState === this.STATES.SHOP) {
            document.getElementById('hudTop').style.display = 'none';
            document.getElementById('shopScreen').classList.add('active');
            this.renderShopUI();
        } else if (newState === this.STATES.GAME_OVER) {
            document.getElementById('hudTop').style.display = 'none';
            document.getElementById('gameOverScreen').classList.add('active');
        }
    }

    /**
     * Khởi tạo một trận đấu sinh tồn mới
     */
    startNewGame() {
        const bonuses = this.getPermanentBonuses();
        const skinColor = this.getSelectedSkinColor();

        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            skinColor,
            bonuses
        );

        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.gems = [];
        this.coins = [];

        this.score = 0;
        this.survivalTime = 0;
        this.enemySpawnTimer = 0.5;
        this.bossTimer = this.bossSpawnInterval;
        document.getElementById('bossWarningBanner').style.display = 'none';

        this.updateHUD();
        this.changeState(this.STATES.PLAYING);
    }

    /**
     * Sinh quái vật ngẫu nhiên (FastEnemy hoặc TankEnemy) ở ngoài rìa 4 cạnh màn hình
     */
    spawnEnemy() {
        const margin = 45;
        let x, y;
        const side = Math.floor(Math.random() * 4);

        if (side === 0) { // Cạnh trên
            x = Math.random() * this.canvas.width;
            y = -margin;
        } else if (side === 1) { // Cạnh phải
            x = this.canvas.width + margin;
            y = Math.random() * this.canvas.height;
        } else if (side === 2) { // Cạnh dưới
            x = Math.random() * this.canvas.width;
            y = this.canvas.height + margin;
        } else { // Cạnh trái
            x = -margin;
            y = Math.random() * this.canvas.height;
        }

        // Hệ số độ khó tăng dần theo thời gian sinh tồn của người chơi
        const difficultyMultiplier = 1 + (this.survivalTime / 45) * 0.45;

        // Tỉ lệ đa hình: 70% sinh ra FastEnemy (vàng), 30% sinh ra TankEnemy (tím)
        if (Math.random() < 0.70) {
            this.enemies.push(new FastEnemy(x, y, difficultyMultiplier));
        } else {
            this.enemies.push(new TankEnemy(x, y, difficultyMultiplier));
        }
    }

    /**
     * Sinh BossEnemy mỗi 30 giây kèm còi hú cảnh báo và rung chấn màn hình
     */
    spawnBoss() {
        const margin = 65;
        const angle = Math.random() * Math.PI * 2;
        const x = this.canvas.width / 2 + Math.cos(angle) * (this.canvas.width / 2 + margin);
        const y = this.canvas.height / 2 + Math.sin(angle) * (this.canvas.height / 2 + margin);

        const difficultyMultiplier = 1 + (this.survivalTime / 30) * 0.35;
        this.enemies.push(new BossEnemy(x, y, difficultyMultiplier));

        this.sound.playBossWarning();
        this.screenShakeTimer = 0.45;

        const banner = document.getElementById('bossWarningBanner');
        banner.style.display = 'block';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 4000);
    }

    /**
     * Tạo hiệu ứng chùm hạt nổ tung (Particle Explosion) tại tọa độ (x, y)
     */
    createExplosion(x, y, color, count = 18) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    /**
     * Kiểm tra va chạm giữa 2 thực thể hình tròn bằng hàm checkCircleCollision trong js/math.js
     */
    checkCollision(entityA, entityB) {
        return checkCircleCollision(entityA, entityB);
    }

    /**
     * Kích hoạt trạng thái Lên Cấp (LEVEL_UP):
     * Tạm dừng trận đấu và hiển thị bảng chọn 3 nâng cấp ngẫu nhiên trong 5 loại nâng cấp.
     */
    triggerLevelUpState() {
        this.sound.playLevelUp();
        this.changeState(this.STATES.LEVEL_UP);

        // Danh sách 5 nâng cấp theo đúng yêu cầu đề bài
        const upgradePool = [
            {
                id: 'fireRate',
                title: 'Tăng Tốc Độ Bắn',
                icon: '⚡',
                desc: 'Giảm 18% thời gian chờ giữa hai loạt đạn, giúp xả đạn dồn dập hơn.',
                tag: '+18% Tốc Bắn',
                apply: (player) => {
                    player.fireDelay = Math.max(0.06, player.fireDelay * 0.82);
                }
            },
            {
                id: 'damage',
                title: 'Tăng Sát Thương',
                icon: '💥',
                desc: 'Nâng cấp lõi năng lượng Plasma, tăng thêm +12 sát thương cho mỗi viên đạn.',
                tag: '+12 Sát Thương',
                apply: (player) => {
                    player.damage += 12;
                }
            },
            {
                id: 'multiShot',
                title: 'Bắn Tia Đạn Tỏa Tròn',
                icon: '🔱',
                desc: 'Gắn thêm nòng phụ, bắn thêm +1 tia đạn tỏa hình quạt mỗi lần khai hỏa.',
                tag: '+1 Tia Đạn',
                apply: (player) => {
                    player.projectileCount += 1;
                }
            },
            {
                id: 'moveSpeed',
                title: 'Tăng Tốc Độ Chạy',
                icon: '🚀',
                desc: 'Tăng +30 tốc độ di chuyển để dễ dàng né đạn của Boss và bầy quái.',
                tag: '+30 Tốc Chạy',
                apply: (player) => {
                    player.speed += 30;
                }
            },
            {
                id: 'healAndHp',
                title: 'Hồi Máu & Cường Hóa',
                icon: '💚',
                desc: 'Hồi phục ngay 50% Máu tối đa và tăng thêm +25 giới hạn Máu tối đa.',
                tag: 'Hồi 50% HP',
                apply: (player) => {
                    player.maxHp += 25;
                    player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.5));
                }
            }
        ];

        // Xáo trộn ngẫu nhiên bằng thuật toán Fisher-Yates Shuffle và chọn 3 nâng cấp đầu tiên
        const shuffled = [...upgradePool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selectedThree = shuffled.slice(0, 3);

        const container = document.getElementById('upgradeCardsContainer');
        container.innerHTML = '';

        selectedThree.forEach((upg) => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-icon">${upg.icon}</div>
                <div class="upgrade-title">${upg.title}</div>
                <div class="upgrade-desc">${upg.desc}</div>
                <div class="upgrade-tag">${upg.tag}</div>
            `;
            card.addEventListener('click', () => {
                upg.apply(this.player);
                this.updateHUD();
                this.changeState(this.STATES.PLAYING);
            });
            container.appendChild(card);
        });
    }

    /**
     * Xử lý khi Player hết máu -> Lưu kỷ lục Điểm Cao Nhất vào localStorage và hiện màn hình GAME_OVER
     */
    triggerGameOver() {
        this.sound.playGameOver();

        if (this.score > this.saveData.highScore) {
            this.saveData.highScore = this.score;
        }
        this.saveToLocalStorage();

        document.getElementById('overScore').textContent = this.score;
        document.getElementById('overHighScore').textContent = this.saveData.highScore;
        document.getElementById('overGoldEarned').textContent = `+${this.player.gold}`;
        document.getElementById('overTimeSurvived').textContent = this.formatTime(this.survivalTime);

        this.changeState(this.STATES.GAME_OVER);
    }

    /**
     * Chuyển sang màn hình Cửa hàng (SHOP)
     */
    openShop() {
        this.changeState(this.STATES.SHOP);
    }

    /**
     * Hiển thị danh sách Nâng cấp vĩnh viễn và Trang phục Neon trong Cửa hàng
     */
    renderShopUI() {
        document.getElementById('shopGoldDisplay').textContent = this.saveData.totalGold;

        // 1. Render các mục Nâng cấp chỉ số vĩnh viễn
        const upgGrid = document.getElementById('shopUpgradesGrid');
        upgGrid.innerHTML = '';

        this.shopUpgradeConfig.forEach((item) => {
            const currentLvl = this.saveData.upgrades[item.id] || 0;
            const isMax = currentLvl >= item.maxLevel;
            const cost = Math.floor(item.baseCost * Math.pow(1.45, currentLvl));
            const canAfford = this.saveData.totalGold >= cost && !isMax;

            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div>
                    <div class="shop-item-title">
                        <span>${item.name}</span>
                        <span class="shop-item-lvl">Lv.${currentLvl}/${item.maxLevel}</span>
                    </div>
                    <div class="shop-item-desc" style="margin-top: 4px;">${item.desc}</div>
                </div>
                <button class="shop-buy-btn" ${!canAfford ? 'disabled' : ''}>
                    ${isMax ? 'ĐÃ TỐI ĐA (MAX)' : `NÂNG CẤP (${cost} 🪙)`}
                </button>
            `;

            const btn = div.querySelector('button');
            btn.addEventListener('click', () => {
                if (this.saveData.totalGold >= cost && currentLvl < item.maxLevel) {
                    this.saveData.totalGold -= cost;
                    this.saveData.upgrades[item.id] = currentLvl + 1;
                    this.saveToLocalStorage();
                    this.sound.playPickup(true);
                    this.renderShopUI();
                }
            });

            upgGrid.appendChild(div);
        });

        // 2. Render danh sách Trang phục Neon (Skins)
        const skinGrid = document.getElementById('shopSkinsGrid');
        skinGrid.innerHTML = '';

        this.skinConfig.forEach((skin) => {
            const isUnlocked = this.saveData.unlockedSkins.includes(skin.id);
            const isSelected = this.saveData.selectedSkin === skin.id;
            const canAfford = this.saveData.totalGold >= skin.cost;

            let btnLabel = '';
            let disabled = false;
            if (isSelected) {
                btnLabel = 'ĐANG SỬ DỤNG ✓';
                disabled = true;
            } else if (isUnlocked) {
                btnLabel = 'TRANG BỊ NGAY';
            } else {
                btnLabel = `MỞ KHÓA (${skin.cost} 🪙)`;
                disabled = !canAfford;
            }

            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-title">
                    <span>${skin.name}</span>
                    <span class="skin-swatch" style="background:${skin.color}; box-shadow: 0 0 10px ${skin.color};"></span>
                </div>
                <button class="shop-buy-btn" ${disabled ? 'disabled' : ''}>${btnLabel}</button>
            `;

            const btn = div.querySelector('button');
            btn.addEventListener('click', () => {
                if (isUnlocked) {
                    this.saveData.selectedSkin = skin.id;
                    this.saveToLocalStorage();
                    this.sound.playPickup(false);
                    this.renderShopUI();
                } else if (this.saveData.totalGold >= skin.cost) {
                    this.saveData.totalGold -= skin.cost;
                    this.saveData.unlockedSkins.push(skin.id);
                    this.saveData.selectedSkin = skin.id;
                    this.saveToLocalStorage();
                    this.sound.playLevelUp();
                    this.renderShopUI();
                }
            });

            skinGrid.appendChild(div);
        });
    }

    /**
     * Cập nhật Điểm Cao Nhất và Tổng Vàng trên màn hình Menu chính
     */
    updateMenuUI() {
        document.getElementById('menuHighScore').textContent = this.saveData.highScore;
        document.getElementById('menuTotalGold').textContent = this.saveData.totalGold;
    }

    /**
     * Chuyển đổi số giây sinh tồn thành định dạng đồng hồ MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Cập nhật thanh Máu (HP), Kinh Nghiệm (EXP), Cấp độ, Vàng và Điểm trên HUD
     */
    updateHUD() {
        if (!this.player) return;

        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        const expPercent = Math.min(100, (this.player.exp / this.player.maxExp) * 100);

        document.getElementById('hpBarFill').style.width = `${hpPercent}%`;
        document.getElementById('expBarFill').style.width = `${expPercent}%`;
        document.getElementById('hpText').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
        document.getElementById('expText').textContent = `${this.player.exp} / ${this.player.maxExp}`;
        document.getElementById('levelText').textContent = this.player.level;
        document.getElementById('goldText').textContent = this.player.gold;
        document.getElementById('scoreText').textContent = this.score;
        document.getElementById('timerBox').textContent = this.formatTime(this.survivalTime);
        document.getElementById('nextBossCountdown').textContent = `${Math.ceil(this.bossTimer)}s`;
    }

    /**
     * Cập nhật toàn bộ logic chiến đấu, di chuyển và kiểm tra va chạm khi ở trạng thái PLAYING
     * @param {number} dt - Delta Time (giây)
     */
    updatePlaying(dt) {
        this.survivalTime += dt;

        // 1. Đếm ngược thời gian xuất hiện BossEnemy (mỗi 30 giây)
        this.bossTimer -= dt;
        if (this.bossTimer <= 0) {
            this.bossTimer = this.bossSpawnInterval;
            this.spawnBoss();
        }

        // 2. Đếm ngược thời gian sinh quái thường (mật độ tăng dần theo thời gian sinh tồn)
        this.enemySpawnTimer -= dt;
        if (this.enemySpawnTimer <= 0) {
            const spawnInterval = Math.max(0.28, 1.15 - (this.survivalTime / 60) * 0.25);
            this.enemySpawnTimer = spawnInterval;
            this.spawnEnemy();
        }

        // 3. Cập nhật Player (hỗ trợ cả WASD+Chuột trên PC và Dual Joystick + Auto-Aim trên Mobile)
        this.player.update(
            dt,
            this.keys,
            this.mouse,
            this.canvas.width,
            this.canvas.height,
            this.touchInput,
            this.enemies
        );

        // Kiểm tra điều kiện khai hỏa:
        // - Khi nhấn chuột trái hoặc bật Tự Động Bắn
        // - Hoặc khi kéo cần gạt ngắm bắn bên phải trên Mobile
        // - Hoặc khi kéo cần gạt di chuyển bên trái trên Mobile và có Enemy trong tầm Auto-Aim
        const shouldShoot =
            this.mouse.isDown ||
            this.autoFire ||
            this.touchInput.aimJoystick.active ||
            (this.touchInput.moveJoystick.active && this.enemies.length > 0);

        if (shouldShoot) {
            this.player.shoot(this.projectiles, this.sound);
        }

        // 4. Cập nhật vị trí đạn của Player
        this.projectiles.forEach((proj) => proj.update(dt, this.canvas.width, this.canvas.height));

        // 5. Cập nhật đạn của Boss và kiểm tra va chạm với Player
        this.enemyProjectiles.forEach((eProj) => {
            eProj.update(dt, this.canvas.width, this.canvas.height);
            if (!eProj.markedForDeletion && this.checkCollision(eProj, this.player)) {
                eProj.markedForDeletion = true;
                if (this.player.invulnerableTimer <= 0) {
                    this.player.hp -= eProj.damage;
                    this.player.invulnerableTimer = 0.25;
                    this.screenShakeTimer = 0.15;
                    this.createExplosion(this.player.x, this.player.y, '#ff0055', 10);
                    if (this.player.hp <= 0) {
                        this.player.hp = 0;
                        this.triggerGameOver();
                    }
                }
            }
        });

        // 6. Cập nhật danh sách Quái vật (Đa hình: FastEnemy, TankEnemy, BossEnemy)
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.player, this.enemyProjectiles);

            // Kiểm tra va chạm giữa từng viên đạn của Player với Quái vật
            for (let j = 0; j < this.projectiles.length; j++) {
                const proj = this.projectiles[j];
                if (!proj.markedForDeletion && this.checkCollision(proj, enemy)) {
                    proj.markedForDeletion = true;
                    enemy.hp -= proj.damage;

                    // Tạo hiệu ứng tia lửa nhỏ tại điểm đạn va chạm
                    this.createExplosion(proj.x, proj.y, enemy.color, 5);

                    // Khi quái vật hết máu -> Nổ tung, cộng điểm và rơi ExperienceGem / GoldCoin
                    if (enemy.hp <= 0 && !enemy.markedForDeletion) {
                        enemy.markedForDeletion = true;
                        const isBoss = enemy instanceof BossEnemy;
                        this.createExplosion(enemy.x, enemy.y, enemy.color, isBoss ? 45 : 18);
                        this.sound.playExplosion(isBoss);
                        this.score += enemy.scoreValue;

                        if (isBoss) {
                            this.screenShakeTimer = 0.4;
                        }

                        // Rơi Ngọc Kinh Nghiệm (ExperienceGem)
                        this.gems.push(new ExperienceGem(enemy.x, enemy.y, enemy.expValue));

                        // Rơi Đồng Xu Vàng (GoldCoin) dựa trên tỉ lệ goldChance
                        if (Math.random() <= enemy.goldChance) {
                            const coinCount = isBoss ? 5 : 1;
                            for (let c = 0; c < coinCount; c++) {
                                const offsetX = (Math.random() - 0.5) * 28;
                                const offsetY = (Math.random() - 0.5) * 28;
                                this.coins.push(new GoldCoin(enemy.x + offsetX, enemy.y + offsetY, isBoss ? 25 : 10));
                            }
                        }
                        break;
                    }
                }
            }

            // Kiểm tra va chạm trực tiếp giữa Quái vật và Player
            if (!enemy.markedForDeletion && this.checkCollision(enemy, this.player)) {
                if (this.player.invulnerableTimer <= 0) {
                    this.player.hp -= enemy.damage;
                    this.player.invulnerableTimer = 0.45;
                    this.screenShakeTimer = 0.2;
                    this.createExplosion(this.player.x, this.player.y, '#ff0055', 12);

                    if (this.player.hp <= 0) {
                        this.player.hp = 0;
                        this.triggerGameOver();
                        return;
                    }
                }
            }
        }

        // 7. Cập nhật Ngọc Kinh Nghiệm (ExperienceGem) và kiểm tra Player nhặt ngọc
        for (let i = 0; i < this.gems.length; i++) {
            const gem = this.gems[i];
            gem.update(dt, this.player);
            if (this.checkCollision(gem, this.player)) {
                gem.markedForDeletion = true;
                this.sound.playPickup(false);
                const leveledUp = this.player.gainExp(gem.expValue);
                if (leveledUp) {
                    this.triggerLevelUpState();
                    break;
                }
            }
        }

        // 8. Cập nhật Đồng Xu Vàng (GoldCoin) và kiểm tra Player nhặt vàng
        for (let i = 0; i < this.coins.length; i++) {
            const coin = this.coins[i];
            coin.update(dt, this.player);
            if (this.checkCollision(coin, this.player)) {
                coin.markedForDeletion = true;
                this.sound.playPickup(true);
                this.player.gold += coin.goldValue;
                this.saveData.totalGold += coin.goldValue;
                this.saveToLocalStorage();
            }
        }

        // 9. Cập nhật hiệu ứng Hạt nổ (Particles)
        this.particles.forEach((p) => p.update(dt));

        // 10. Dọn dẹp các đối tượng đã đánh dấu xóa (markedForDeletion = true)
        this.enemies = this.enemies.filter((e) => !e.markedForDeletion);
        this.projectiles = this.projectiles.filter((p) => !p.markedForDeletion);
        this.enemyProjectiles = this.enemyProjectiles.filter((p) => !p.markedForDeletion);
        this.particles = this.particles.filter((p) => !p.markedForDeletion);
        this.gems = this.gems.filter((g) => !g.markedForDeletion);
        this.coins = this.coins.filter((c) => !c.markedForDeletion);

        if (this.screenShakeTimer > 0) {
            this.screenShakeTimer -= dt;
        }

        this.updateHUD();
    }

    /**
     * Vẽ lưới tọa độ Cyberpunk dưới nền Canvas
     */
    drawCyberGrid() {
        const ctx = this.ctx;
        const gridSize = 55;

        ctx.save();
        ctx.fillStyle = '#06070e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
        ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Khi bật Debug Mode, hiển thị thêm nhãn tọa độ (x, y) tại các nút lưới
        if (this.debugMode) {
            ctx.fillStyle = 'rgba(0, 255, 102, 0.32)';
            ctx.font = '10px Consolas, monospace';
            for (let x = gridSize * 2; x < this.canvas.width; x += gridSize * 3) {
                for (let y = gridSize * 2; y < this.canvas.height; y += gridSize * 3) {
                    ctx.fillText(`(${x},${y})`, x + 4, y - 4);
                }
            }
        }

        ctx.restore();
    }

    /**
     * Vẽ vòng tròn khóa mục tiêu tự động (Smart Auto-Aim Reticle) trên Mobile
     * @param {CanvasRenderingContext2D} ctx
     */
    drawAutoAimReticle(ctx) {
        if (!this.player || !this.player.autoAimTarget) return;
        const target = this.player.autoAimTarget;

        ctx.save();
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ff66';
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Vẽ trực quan 2 cần gạt ảo (Virtual Joysticks) trên màn hình cảm ứng Mobile/Tablet:
     * - Bên trái: Movement Joystick (màu Cyan #00f3ff)
     * - Bên phải: Aim & Shoot Joystick (màu Hồng Neon #ff0055)
     * @param {CanvasRenderingContext2D} ctx
     */
    drawVirtualJoysticks(ctx) {
        if (this.state !== this.STATES.PLAYING) return;
        const { isTouchDevice, moveJoystick, aimJoystick } = this.touchInput;
        if (!isTouchDevice && !moveJoystick.active && !aimJoystick.active) return;

        // Hàm con vẽ 1 Joystick với vòng đế lớn và núm gạt bên trong
        const renderJoystick = (baseX, baseY, stickX, stickY, maxRadius, color, label, isActive) => {
            ctx.save();
            ctx.globalAlpha = isActive ? 0.85 : 0.32;

            // Vòng tròn đế Joystick (Outer Base Ring)
            ctx.beginPath();
            ctx.arc(baseX, baseY, maxRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(8, 14, 30, 0.55)';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = color;
            ctx.shadowBlur = isActive ? 16 : 6;
            ctx.shadowColor = color;
            ctx.stroke();

            // Đường nối từ tâm đế tới núm gạt
            if (isActive) {
                ctx.beginPath();
                ctx.moveTo(baseX, baseY);
                ctx.lineTo(stickX, stickY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Núm gạt ngón tay cái (Inner Thumb Stick)
            ctx.beginPath();
            ctx.arc(stickX, stickY, 22, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 18;
            ctx.shadowColor = color;
            ctx.fill();

            // Nhãn hướng dẫn bên dưới cần gạt
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#e2f1ff';
            ctx.font = 'bold 11px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, baseX, baseY + maxRadius + 18);

            ctx.restore();
        };

        // Vị trí mặc định khi chưa chạm ngón tay ở 2 góc dưới màn hình
        const defaultLeftX = 95;
        const defaultLeftY = this.canvas.height - 105;
        const defaultRightX = this.canvas.width - 95;
        const defaultRightY = this.canvas.height - 105;

        // 1. Vẽ Cần gạt di chuyển bên trái (Movement Joystick)
        if (moveJoystick.active) {
            renderJoystick(
                moveJoystick.baseX,
                moveJoystick.baseY,
                moveJoystick.stickX,
                moveJoystick.stickY,
                moveJoystick.maxRadius,
                '#00f3ff',
                'DI CHUYỂN',
                true
            );
        } else {
            renderJoystick(
                defaultLeftX,
                defaultLeftY,
                defaultLeftX,
                defaultLeftY,
                moveJoystick.maxRadius,
                '#00f3ff',
                'DI CHUYỂN',
                false
            );
        }

        // 2. Vẽ Cần gạt ngắm bắn bên phải (Aim & Shoot Joystick)
        if (aimJoystick.active) {
            renderJoystick(
                aimJoystick.baseX,
                aimJoystick.baseY,
                aimJoystick.stickX,
                aimJoystick.stickY,
                aimJoystick.maxRadius,
                '#ff0055',
                'NGẮM BẮN',
                true
            );
        } else {
            renderJoystick(
                defaultRightX,
                defaultRightY,
                defaultRightX,
                defaultRightY,
                aimJoystick.maxRadius,
                '#ff0055',
                'NGẮM / AUTO-AIM',
                false
            );
        }
    }

    /**
     * Vẽ toàn bộ các thực thể trong thế giới Game, Virtual Joysticks và lớp phủ Debug Mode
     */
    drawWorld() {
        const ctx = this.ctx;
        ctx.save();

        // Hiệu ứng rung màn hình (Screen Shake) khi Boss xuất hiện hoặc va chạm mạnh
        if (this.screenShakeTimer > 0) {
            const shakeX = (Math.random() - 0.5) * 10;
            const shakeY = (Math.random() - 0.5) * 10;
            ctx.translate(shakeX, shakeY);
        }

        this.drawCyberGrid();

        if (!this.player) {
            ctx.restore();
            return;
        }

        // Vẽ Vật phẩm rơi (ExperienceGem & GoldCoin)
        this.gems.forEach((gem) => gem.draw(ctx));
        this.coins.forEach((coin) => coin.draw(ctx));

        // Vẽ Hạt nổ (Particles)
        this.particles.forEach((p) => p.draw(ctx));

        // Vẽ Đạn của Player và Đạn của Boss
        this.projectiles.forEach((proj) => proj.draw(ctx));
        this.enemyProjectiles.forEach((eProj) => eProj.draw(ctx));

        // Vẽ Quái vật (Đa hình: mỗi lớp con tự gọi hàm draw riêng)
        this.enemies.forEach((enemy) => enemy.draw(ctx));

        // Vẽ vòng khóa mục tiêu tự động (Smart Auto-Aim) trên Mobile
        this.drawAutoAimReticle(ctx);

        // Vẽ Nhân vật chính (Player)
        this.player.draw(ctx);

        // ====================================================================
        // CHẾ ĐỘ DEBUG MODE TRỰC QUAN DÀNH CHO THUYẾT TRÌNH BÁO CÁO (PHÍM F)
        // ====================================================================
        if (this.debugMode) {
            // 1. Vẽ vòng tròn Hitbox của Player và Bán kính hút vật phẩm (Magnet Range)
            this.player.drawDebugHitbox(ctx);

            ctx.save();
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, this.player.magnetRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 6]);
            ctx.stroke();

            // Vẽ tia ngắm từ tâm Player theo hướng bắn (Chuột hoặc Auto-Aim / Joystick)
            const aimLineX = this.player.x + Math.cos(this.player.aimAngle) * 260;
            const aimLineY = this.player.y + Math.sin(this.player.aimAngle) * 260;
            ctx.beginPath();
            ctx.moveTo(this.player.x, this.player.y);
            ctx.lineTo(aimLineX, aimLineY);
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.6)';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.restore();

            // 2. Vẽ Hitbox và đường thẳng Vector hướng đi từ từng Quái vật tới Player
            this.enemies.forEach((enemy) => enemy.drawDebugVector(ctx, this.player));

            // 3. Vẽ Hitbox của toàn bộ Đạn và Vật phẩm
            this.projectiles.forEach((proj) => proj.drawDebugHitbox(ctx));
            this.enemyProjectiles.forEach((eProj) => eProj.drawDebugHitbox(ctx));
            this.gems.forEach((gem) => gem.drawDebugHitbox(ctx));
            this.coins.forEach((coin) => coin.drawDebugHitbox(ctx));
        }

        ctx.restore();

        // Vẽ 2 Cần gạt ảo (Virtual Joysticks) cố định trên màn hình (không bị ảnh hưởng bởi Screen Shake)
        this.drawVirtualJoysticks(ctx);
    }

    /**
     * Cập nhật bảng thông số kỹ thuật Debug Telemetry (FPS, Số lượng Object, Góc ngắm, Chế độ Input)
     */
    updateDebugTelemetry() {
        if (!this.debugMode) return;

        const totalObjects =
            (this.player ? 1 : 0) +
            this.enemies.length +
            this.projectiles.length +
            this.enemyProjectiles.length +
            this.particles.length +
            this.gems.length +
            this.coins.length;

        document.getElementById('dbgFps').textContent = `${this.fps} FPS (${this.frameTimeMs.toFixed(1)}ms)`;
        document.getElementById('dbgState').textContent = this.state;

        const inputLabel = this.touchInput.isTouchDevice
            ? 'Mobile (Dual Joystick + Auto-Aim)'
            : 'PC (WASD + Mouse)';
        const dbgInputEl = document.getElementById('dbgInputMode');
        if (dbgInputEl) {
            dbgInputEl.textContent = inputLabel;
        }

        if (this.player) {
            document.getElementById('dbgPlayerPos').textContent = `${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
            const deg = radToDeg(this.player.aimAngle).toFixed(1);
            document.getElementById('dbgAimAngle').textContent = `${this.player.aimAngle.toFixed(2)} rad (${deg}°)`;
        }

        document.getElementById('dbgTotalObj').textContent = totalObjects;
        document.getElementById('dbgEnemyCount').textContent = this.enemies.length;
        document.getElementById('dbgProjCount').textContent = this.projectiles.length + this.enemyProjectiles.length;
        document.getElementById('dbgPartCount').textContent = this.particles.length;
        document.getElementById('dbgLootCount').textContent = this.gems.length + this.coins.length;
    }

    /**
     * VÒNG LẶP GAME CHÍNH (MAIN GAME LOOP) SỬ DỤNG REQUESTANIMATIONFRAME
     * @param {number} timestamp - Thời điểm hiện tại do trình duyệt cung cấp (ms)
     */
    gameLoop(timestamp) {
        const rawDt = (timestamp - this.lastFrameTime) / 1000;
        const dt = Math.min(0.1, Math.max(0.001, rawDt));
        this.lastFrameTime = timestamp;

        // Tính toán chỉ số FPS cập nhật mỗi 0.2 giây
        this.fpsUpdateTimer += dt;
        if (this.fpsUpdateTimer >= 0.2) {
            this.fps = Math.round(1 / rawDt);
            this.frameTimeMs = rawDt * 1000;
            this.fpsUpdateTimer = 0;
            this.updateDebugTelemetry();
        }

        // Chỉ cập nhật thế giới khi đang ở trạng thái PLAYING
        if (this.state === this.STATES.PLAYING) {
            this.updatePlaying(dt);
        }

        // Luôn vẽ thế giới game dưới nền Canvas
        this.drawWorld();

        // Tiếp tục đệ quy khung hình tiếp theo
        requestAnimationFrame((nextTimestamp) => this.gameLoop(nextTimestamp));
    }
}
