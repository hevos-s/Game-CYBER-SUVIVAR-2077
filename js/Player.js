/**
 * ============================================================================
 * FILE: js/Player.js
 * MÔ TẢ: Định nghĩa lớp Player (Nhân vật người chơi chính).
 *        Hỗ trợ điều khiển đa nền tảng (Cross-Platform Input):
 *        - Trên PC: Bàn phím WASD / Phím Mũi Tên kết hợp ngắm bắn bằng Chuột.
 *        - Trên Mobile / Tablet: Cần gạt ảo bên trái (Movement Joystick) để di chuyển
 *          360 độ mượt mà, kết hợp Cần gạt ngắm bắn bên phải (Aim Joystick) HOẶC
 *          cơ chế Smart Auto-Aim tự động khóa mục tiêu vào con Enemy gần nhất.
 * TÍNH CHẤT HƯỚNG ĐỐI TƯỢNG (OOP) ĐỂ BÁO CÁO:
 * 1. Tính Kế Thừa (Inheritance):
 *    - `Player` kế thừa từ lớp cha `Entity` (`class Player extends Entity`),
 *      tái sử dụng các thuộc tính `x`, `y`, `radius`, `color`, `speed` và phương thức
 *      `drawDebugHitbox(ctx)`.
 * 2. Tính Đóng Gói (Encapsulation):
 *    - Đóng gói toàn bộ chỉ số sinh tồn và chiến đấu của nhân vật: Máu (`hp`, `maxHp`),
 *      Kinh nghiệm (`exp`, `maxExp`), Cấp độ (`level`), Vàng (`gold`), Sát thương (`damage`),
 *      Tốc độ bắn (`fireDelay`), Số tia đạn (`projectileCount`) và Tầm hút (`magnetRadius`).
 * 3. Tính Đa Hình (Polymorphism):
 *    - Ghi đè phương thức `draw(ctx)` để vẽ nhân vật Cyberpunk cùng nòng súng xoay 360 độ
 *      theo góc ngắm (`aimAngle`) bằng phép biến đổi hệ trục `ctx.translate` và `ctx.rotate`.
 * ============================================================================
 */

class Player extends Entity {
    /**
     * Khởi tạo nhân vật chính ở giữa màn hình với chỉ số cộng thêm từ Cửa hàng (Shop)
     * @param {number} x - Hoành độ ban đầu
     * @param {number} y - Tung độ ban đầu
     * @param {string} skinColor - Mã màu trang phục Neon đã chọn trong Shop
     * @param {Object} permanentBonuses - Các chỉ số nâng cấp vĩnh viễn đọc từ localStorage
     */
    constructor(x, y, skinColor, permanentBonuses) {
        // Gọi constructor của lớp cha Entity
        super(x, y, 18, skinColor, 240 + permanentBonuses.speedBonus);

        // Chỉ số Sinh tồn & Chiến đấu (Đã cộng thêm nâng cấp vĩnh viễn từ Shop)
        this.maxHp = 100 + permanentBonuses.hpBonus;
        this.hp = this.maxHp;
        this.damage = 25 + permanentBonuses.damageBonus;
        this.fireDelay = Math.max(0.08, 0.28 - permanentBonuses.fireRateBonus); // Thời gian hồi giữa 2 lần bắn (giây)
        this.fireTimer = 0;
        this.projectileCount = 1; // Số lượng tia đạn bắn ra mỗi lần (Tăng khi chọn nâng cấp Tỏa tròn)
        this.magnetRadius = 115 + permanentBonuses.magnetBonus; // Bán kính tự động hút Ngọc & Vàng

        // Chỉ số Cấp độ, Kinh nghiệm và Vàng thu thập trong màn chơi
        this.level = 1;
        this.exp = 0;
        this.maxExp = 40;
        this.gold = 0;

        // Góc xoay nòng súng (tính bằng Radian) và mục tiêu khóa tự động trên Mobile
        this.aimAngle = 0;
        this.autoAimTarget = null;

        // Thời gian miễn nhiễm sát thương ngắn sau khi bị quái chạm (0.45s)
        this.invulnerableTimer = 0;
    }

    /**
     * Cập nhật vị trí người chơi và hướng xoay nòng súng mỗi khung hình (Hỗ trợ cả PC và Mobile)
     * @param {number} dt - Delta Time (giây)
     * @param {Object} keys - Trạng thái các phím đang nhấn (WASD / Arrow Keys)
     * @param {Object} mouse - Tọa độ chuột {x, y, isDown}
     * @param {number} canvasWidth - Chiều rộng màn hình Canvas
     * @param {number} canvasHeight - Chiều cao màn hình Canvas
     * @param {Object} touchInput - Trạng thái 2 cần gạt cảm ứng {isTouchDevice, moveJoystick, aimJoystick}
     * @param {Array<Enemy>} enemies - Danh sách quái vật hiện có (phục vụ Smart Auto-Aim)
     */
    update(dt, keys, mouse, canvasWidth, canvasHeight, touchInput = null, enemies = []) {
        // ====================================================================
        // 1. XỬ LÝ DI CHUYỂN: KẾT HỢP VIRTUAL JOYSTICK TRÁI (MOBILE) & WASD (PC)
        // ====================================================================
        let moveX = 0;
        let moveY = 0;

        if (touchInput && touchInput.moveJoystick.active) {
            // Trên Mobile: Lấy trực tiếp vector analog (vx, vy) từ Cần gạt di chuyển bên trái
            moveX = touchInput.moveJoystick.vx;
            moveY = touchInput.moveJoystick.vy;

            this.x += moveX * this.speed * dt;
            this.y += moveY * this.speed * dt;
        } else {
            // Trên PC: Đọc trạng thái bàn phím WASD hoặc Phím Mũi Tên
            if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
            if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

            // Chuẩn hóa vector chuyển động bằng hàm normalizeVector trong js/math.js:
            // Đảm bảo khi đi chéo (giữ 2 phím cùng lúc) tốc độ không bị vượt quá speed chuẩn.
            if (moveX !== 0 || moveY !== 0) {
                const unitVec = normalizeVector(moveX, moveY);
                this.x += unitVec.x * this.speed * dt;
                this.y += unitVec.y * this.speed * dt;
            }
        }

        // Giới hạn nhân vật không đi ra ngoài biên của Canvas bằng hàm clamp trong js/math.js
        this.x = clamp(this.x, this.radius, canvasWidth - this.radius);
        this.y = clamp(this.y, this.radius, canvasHeight - this.radius);

        // ====================================================================
        // 2. XỬ LÝ XOAY NÒNG SÚNG: JOYSTICK PHẢI / SMART AUTO-AIM (MOBILE) & CHUỘT (PC)
        // ====================================================================
        this.autoAimTarget = null;

        if (
            touchInput &&
            touchInput.aimJoystick.active &&
            Math.hypot(touchInput.aimJoystick.vx, touchInput.aimJoystick.vy) > 0.08
        ) {
            // Ưu tiên 1 (Mobile): Người chơi chủ động kéo Cần gạt ngắm bắn bên phải
            this.aimAngle = touchInput.aimJoystick.angle;
        } else if (touchInput && touchInput.isTouchDevice) {
            // Ưu tiên 2 (Mobile Smart Auto-Aim): Khi người chơi chỉ kéo di chuyển bên trái,
            // súng tự động tìm và xoay về phía con Enemy gần nhất để giảm thao tác rườm rà.
            const nearestEnemy = findNearestEnemy(this.x, this.y, enemies);
            if (nearestEnemy) {
                this.autoAimTarget = nearestEnemy;
                this.aimAngle = calculateAngle(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            } else if (
                touchInput.moveJoystick.active &&
                Math.hypot(touchInput.moveJoystick.vx, touchInput.moveJoystick.vy) > 0.08
            ) {
                // Nếu trên màn hình chưa có quái, nòng súng xoay theo hướng đang di chuyển
                this.aimAngle = Math.atan2(touchInput.moveJoystick.vy, touchInput.moveJoystick.vx);
            }
        } else {
            // Ưu tiên 3 (PC): Xoay nòng súng hướng về con trỏ chuột bằng hàm calculateAngle (Math.atan2)
            this.aimAngle = calculateAngle(this.x, this.y, mouse.x, mouse.y);
        }

        // 3. Cập nhật bộ đếm thời gian nạp đạn và miễn nhiễm sát thương
        if (this.fireTimer > 0) {
            this.fireTimer -= dt;
        }
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
    }

    /**
     * Khai hỏa bắn đạn theo góc ngắm hiện tại (Hỗ trợ bắn đơn tia hoặc nhiều tia tỏa hình quạt)
     * @param {Array<Projectile>} projectiles - Mảng chứa các viên đạn của Game
     * @param {SoundManager} sound - Đối tượng phát âm thanh Web Audio API
     */
    shoot(projectiles, sound) {
        if (this.fireTimer > 0) return;
        this.fireTimer = this.fireDelay;

        // Nếu người chơi đã nâng cấp "Bắn thêm tia đạn tỏa tròn" (projectileCount > 1),
        // ta chia đều góc lệch hình quạt xung quanh góc ngắm chính (aimAngle)
        const spreadStep = 0.16; // Khoảng cách góc giữa 2 tia đạn (~9 độ)
        const totalSpread = (this.projectileCount - 1) * spreadStep;
        const startAngle = this.aimAngle - totalSpread / 2;

        for (let i = 0; i < this.projectileCount; i++) {
            const bulletAngle = startAngle + i * spreadStep;

            // Tính tọa độ đầu nòng súng cách tâm nhân vật một khoảng (radius + 10)
            const muzzleX = this.x + Math.cos(bulletAngle) * (this.radius + 10);
            const muzzleY = this.y + Math.sin(bulletAngle) * (this.radius + 10);

            projectiles.push(
                new Projectile(
                    muzzleX,
                    muzzleY,
                    5,
                    this.color,
                    680,
                    bulletAngle,
                    this.damage,
                    false // Đạn của người chơi (isEnemy = false)
                )
            );
        }

        sound.playShoot();
    }

    /**
     * Cộng điểm kinh nghiệm khi nhặt ExperienceGem và kiểm tra điều kiện Lên cấp
     * @param {number} amount - Lượng EXP nhận được
     * @returns {boolean} Trả về true nếu nhân vật đủ EXP để lên cấp mới
     */
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.level++;
            // Lượng EXP yêu cầu cho cấp độ tiếp theo tăng thêm 30% + 15 điểm
            this.maxExp = Math.floor(this.maxExp * 1.3 + 15);
            return true;
        }
        return false;
    }

    /**
     * Ghi đè phương thức draw: Vẽ nhân vật Cyberpunk phát sáng cùng tháp súng xoay theo góc ngắm
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Vẽ vòng hào quang năng lượng nhẹ xung quanh nhân vật
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Xoay hệ trục tọa độ cục bộ theo góc ngắm aimAngle
        ctx.rotate(this.aimAngle);

        // Vẽ nòng súng (Gun Barrel) hướng theo trục X dương sau khi đã rotate
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillRect(6, -4, this.radius + 12, 8);

        // Vẽ viền Neon cho nòng súng
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(6, -4, this.radius + 12, 8);

        // Vẽ thân nhân vật hình tròn phát sáng Neon (nhấp nháy trắng khi vừa bị thương)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.invulnerableTimer > 0 ? '#ffffff' : this.color;
        ctx.shadowBlur = 22;
        ctx.shadowColor = this.color;
        ctx.fill();

        // Vẽ lõi tối màu bên trong thân nhân vật tạo chiều sâu Cyberpunk
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.48, 0, Math.PI * 2);
        ctx.fillStyle = '#06070e';
        ctx.fill();

        ctx.restore();
    }
}
