/**
 * ============================================================================
 * FILE: js/main.js
 * MÔ TẢ: Điểm khởi đầu của chương trình (Entry Point).
 *        Chứa đoạn code khởi tạo đối tượng Game, đăng ký các bộ lắng nghe sự kiện
 *        (Event Listeners) cho cả 2 nền tảng:
 *        1. Máy tính (PC): Bàn phím WASD / Mũi tên, phím tắt F (Debug Mode) và Chuột.
 *        2. Điện thoại / Máy tính bảng (Mobile / Tablet): Cảm ứng đa điểm (Multi-touch)
 *           với 2 vùng điều khiển độc lập:
 *           - Nửa màn hình bên trái: Cần gạt di chuyển (Movement Joystick).
 *           - Nửa màn hình bên phải: Cần gạt ngắm bắn (Aim & Shoot Joystick).
 * ============================================================================
 */

/**
 * Hàm cập nhật tọa độ núm gạt (stickX, stickY) và vector chuẩn hóa (vx, vy)
 * khi người chơi kéo ngón tay trên màn hình cảm ứng.
 * @param {Object} joystick - Đối tượng moveJoystick hoặc aimJoystick
 * @param {number} touchX - Tọa độ X hiện tại của ngón tay
 * @param {number} touchY - Tọa độ Y hiện tại của ngón tay
 */
function updateJoystickVector(joystick, touchX, touchY) {
    const dx = touchX - joystick.baseX;
    const dy = touchY - joystick.baseY;
    const dist = calculateDistance(joystick.baseX, joystick.baseY, touchX, touchY);
    const angle = calculateAngle(joystick.baseX, joystick.baseY, touchX, touchY);

    // Giới hạn khoảng cách kéo núm gạt không vượt quá bán kính vòng đế (maxRadius)
    const clampedDist = Math.min(dist, joystick.maxRadius);

    joystick.stickX = joystick.baseX + Math.cos(angle) * clampedDist;
    joystick.stickY = joystick.baseY + Math.sin(angle) * clampedDist;

    // Tính tỷ lệ độ mạnh của lực kéo trong đoạn [0, 1]
    const magnitude = clampedDist / joystick.maxRadius;
    joystick.vx = Math.cos(angle) * magnitude;
    joystick.vy = Math.sin(angle) * magnitude;
    joystick.angle = angle;
}

/**
 * Hàm thiết lập toàn bộ sự kiện điều khiển (Bàn phím, Chuột, Cảm ứng đa điểm và UI)
 * @param {Game} game - Đối tượng quản lý tổng thể của trò chơi
 */
function setupEventListeners(game) {
    // 1. Tự động cập nhật kích thước Canvas khi xoay ngang/dọc điện thoại hoặc đổi cỡ cửa sổ
    window.addEventListener('resize', () => {
        game.resizeCanvas();
    });

    // ========================================================================
    // A. ĐIỀU KHIỂN TRÊN MÁY TÍNH (PC: BÀN PHÍM WASD + CHUỘT + PHÍM TẮT F)
    // ========================================================================
    window.addEventListener('keydown', (e) => {
        game.keys[e.code] = true;

        // Phím tắt F: Bật / Tắt chế độ Debug Mode phục vụ thuyết trình báo cáo
        if (e.code === 'KeyF') {
            game.toggleDebugMode();
        }
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
        game.mouse.x = e.clientX;
        game.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            game.mouse.isDown = true;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            game.mouse.isDown = false;
        }
    });

    // ========================================================================
    // B. ĐIỀU KHIỂN CẢM ỨNG ĐA ĐIỂM TRÊN DI ĐỘNG (MOBILE VIRTUAL JOYSTICKS)
    // ========================================================================
    const canvas = game.canvas;

    /**
     * Sự kiện touchstart: Khi người chơi chạm 1 hoặc 2 ngón tay lên màn hình Canvas.
     * - Nếu chạm ở nửa bên trái (clientX < width / 2): Kích hoạt Cần gạt di chuyển (moveJoystick).
     * - Nếu chạm ở nửa bên phải (clientX >= width / 2): Kích hoạt Cần gạt ngắm bắn (aimJoystick).
     */
    canvas.addEventListener(
        'touchstart',
        (e) => {
            if (game.state !== game.STATES.PLAYING) return;
            e.preventDefault();

            // Đánh dấu thiết bị cảm ứng và mở khóa âm thanh Web Audio API trên trình duyệt di động
            game.touchInput.isTouchDevice = true;
            game.sound.initContext();

            const halfWidth = window.innerWidth / 2;
            const { moveJoystick, aimJoystick } = game.touchInput;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const tx = touch.clientX;
                const ty = touch.clientY;

                // Vùng bên trái màn hình -> Cần gạt di chuyển (Movement Joystick)
                if (tx < halfWidth && !moveJoystick.active) {
                    moveJoystick.active = true;
                    moveJoystick.touchId = touch.identifier;
                    moveJoystick.baseX = tx;
                    moveJoystick.baseY = ty;
                    moveJoystick.stickX = tx;
                    moveJoystick.stickY = ty;
                    moveJoystick.vx = 0;
                    moveJoystick.vy = 0;
                }
                // Vùng bên phải màn hình -> Cần gạt ngắm bắn (Aim & Shoot Joystick)
                else if (tx >= halfWidth && !aimJoystick.active) {
                    aimJoystick.active = true;
                    aimJoystick.touchId = touch.identifier;
                    aimJoystick.baseX = tx;
                    aimJoystick.baseY = ty;
                    aimJoystick.stickX = tx;
                    aimJoystick.stickY = ty;
                    aimJoystick.vx = 0;
                    aimJoystick.vy = 0;
                }
            }
        },
        { passive: false }
    );

    /**
     * Sự kiện touchmove: Khi người chơi vuốt ngón tay để điều khiển hướng di chuyển hoặc hướng ngắm.
     * Theo dõi độc lập từng ngón tay thông qua touch.identifier (Hỗ trợ Multi-touch 2 ngón cùng lúc).
     */
    canvas.addEventListener(
        'touchmove',
        (e) => {
            if (game.state !== game.STATES.PLAYING) return;
            e.preventDefault();

            const { moveJoystick, aimJoystick } = game.touchInput;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];

                if (moveJoystick.active && touch.identifier === moveJoystick.touchId) {
                    updateJoystickVector(moveJoystick, touch.clientX, touch.clientY);
                } else if (aimJoystick.active && touch.identifier === aimJoystick.touchId) {
                    updateJoystickVector(aimJoystick, touch.clientX, touch.clientY);
                }
            }
        },
        { passive: false }
    );

    /**
     * Hàm xử lý khi người chơi nhấc ngón tay khỏi màn hình (touchend / touchcancel)
     */
    const handleTouchEnd = (e) => {
        const { moveJoystick, aimJoystick } = game.touchInput;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];

            if (moveJoystick.active && touch.identifier === moveJoystick.touchId) {
                moveJoystick.active = false;
                moveJoystick.touchId = null;
                moveJoystick.vx = 0;
                moveJoystick.vy = 0;
            } else if (aimJoystick.active && touch.identifier === aimJoystick.touchId) {
                aimJoystick.active = false;
                aimJoystick.touchId = null;
                aimJoystick.vx = 0;
                aimJoystick.vy = 0;
            }
        }
    };

    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // ========================================================================
    // C. CÁC NÚT GIAO DIỆN NGƯỜI DÙNG (HUD, DEBUG PANEL, MENU, SHOP)
    // ========================================================================
    document.getElementById('btnToggleDebug').addEventListener('click', () => {
        game.toggleDebugMode();
    });

    document.getElementById('btnToggleAutoFire').addEventListener('click', () => {
        game.autoFire = !game.autoFire;
        const btn = document.getElementById('btnToggleAutoFire');
        btn.textContent = `Tự Động Bắn: ${game.autoFire ? 'BẬT' : 'TẮT'}`;
        btn.classList.toggle('active-autofire', game.autoFire);
    });

    document.getElementById('btnToggleSound').addEventListener('click', () => {
        const enabled = game.sound.toggleMute();
        document.getElementById('btnToggleSound').textContent = `Âm Thanh: ${enabled ? 'BẬT' : 'TẮT'}`;
    });

    // Các nút hỗ trợ nhanh trong bảng Debug Mode (Dùng để demo nhanh khi bảo vệ đồ án)
    document.getElementById('dbgBtnSpawnBoss').addEventListener('click', () => {
        if (game.state === game.STATES.PLAYING) {
            game.spawnBoss();
        }
    });

    document.getElementById('dbgBtnLevelUp').addEventListener('click', () => {
        if (game.state === game.STATES.PLAYING && game.player) {
            game.player.gainExp(game.player.maxExp);
            game.triggerLevelUpState();
        }
    });

    document.getElementById('dbgBtnAddGold').addEventListener('click', () => {
        game.saveData.totalGold += 500;
        if (game.player) {
            game.player.gold += 500;
        }
        game.saveToLocalStorage();
        game.updateHUD();
    });

    // Các nút điều hướng giữa các trạng thái (MENU, PLAYING, SHOP, GAME_OVER)
    document.getElementById('btnStartGame').addEventListener('click', () => {
        game.sound.initContext();
        game.startNewGame();
    });

    document.getElementById('btnRestartGame').addEventListener('click', () => {
        game.sound.initContext();
        game.startNewGame();
    });

    document.getElementById('btnOpenShop').addEventListener('click', () => {
        game.openShop();
    });

    document.getElementById('btnGameOverToShop').addEventListener('click', () => {
        game.openShop();
    });

    document.getElementById('btnCloseShop').addEventListener('click', () => {
        game.changeState(game.STATES.MENU);
    });

    document.getElementById('btnGameOverToMenu').addEventListener('click', () => {
        game.changeState(game.STATES.MENU);
    });
}

// Khởi tạo đối tượng Game, đăng ký sự kiện và bắt đầu chạy vòng lặp chính ngay khi DOM tải xong
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.cyberSurvivorGame = game;
    setupEventListeners(game);
    game.start();
});
