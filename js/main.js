/**
 * ============================================================================
 * FILE: js/main.js
 * MÔ TẢ: Điểm khởi đầu của chương trình (Entry Point).
 *        Chứa đoạn code khởi tạo đối tượng Game, đăng ký các bộ lắng nghe sự kiện
 *        (Event Listeners) cho bàn phím, chuột, cửa sổ trình duyệt, các nút giao diện
 *        và bắt đầu khởi chạy vòng lặp game chính (requestAnimationFrame).
 * ============================================================================
 */

/**
 * Hàm thiết lập toàn bộ sự kiện điều khiển (Bàn phím, Chuột và Giao diện UI)
 * @param {Game} game - Đối tượng quản lý tổng thể của trò chơi
 */
function setupEventListeners(game) {
    // 1. Tự động cập nhật kích thước Canvas khi người dùng phóng to / thu nhỏ trình duyệt
    window.addEventListener('resize', () => {
        game.resizeCanvas();
    });

    // 2. Lắng nghe sự kiện nhấn phím xuống (WASD, Phím mũi tên và phím tắt F bật Debug Mode)
    window.addEventListener('keydown', (e) => {
        game.keys[e.code] = true;

        // Phím tắt F: Bật / Tắt chế độ Debug Mode phục vụ thuyết trình báo cáo
        if (e.code === 'KeyF') {
            game.toggleDebugMode();
        }
    });

    // 3. Lắng nghe sự kiện nhả phím ra
    window.addEventListener('keyup', (e) => {
        game.keys[e.code] = false;
    });

    // 4. Lắng nghe sự kiện di chuyển con trỏ chuột để xoay nòng súng 360 độ
    window.addEventListener('mousemove', (e) => {
        game.mouse.x = e.clientX;
        game.mouse.y = e.clientY;
    });

    // 5. Lắng nghe sự kiện nhấn giữ và nhả chuột trái để khai hỏa
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

    // 6. Các nút chức năng trên thanh HUD góc trên bên phải
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

    // 7. Các nút hỗ trợ nhanh trong bảng Debug Mode (Dùng để demo nhanh khi bảo vệ đồ án)
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

    // 8. Các nút điều hướng giữa các trạng thái (MENU, PLAYING, SHOP, GAME_OVER)
    document.getElementById('btnStartGame').addEventListener('click', () => {
        game.startNewGame();
    });

    document.getElementById('btnRestartGame').addEventListener('click', () => {
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

