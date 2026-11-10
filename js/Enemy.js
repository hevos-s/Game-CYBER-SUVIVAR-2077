/**
 * ============================================================================
 * FILE: js/Enemy.js
 * MÔ TẢ: Định nghĩa lớp Enemy (Kẻ địch cơ sở) kế thừa từ Entity, cùng 3 lớp con
 *        thể hiện rõ nét tính ĐA HÌNH (Polymorphism):
 *        1. FastEnemy (Quái nhỏ, chạy nhanh, ít máu, màu vàng rực)
 *        2. TankEnemy (Quái to, chạy chậm, máu trâu, màu tím Neon)
 *        3. BossEnemy (Trùm cuối rất to, máu cực trâu, xuất hiện mỗi 30 giây,
 *                      màu đỏ rực, biết bắn đạn về phía người chơi)
 * TÍNH CHẤT HƯỚNG ĐỐI TƯỢNG (OOP) ĐỂ BÁO CÁO:
 * - Kế thừa nhiều tầng (Multilevel Inheritance):
 *   `Entity` -> `Enemy` -> (`FastEnemy`, `TankEnemy`, `BossEnemy`).
 * - Đa hình (Polymorphism):
 *   Trong vòng lặp của `Game`, tất cả quái vật được lưu chung trong một mảng `this.enemies`.
 *   Khi gọi `enemy.update(dt, player, enemyProjectiles)` và `enemy.draw(ctx)`, chương trình
 *   tự động thực thi hành vi và cách vẽ riêng của từng lớp con mà không cần rẽ nhánh if-else.
 * ============================================================================
 */

/**
 * LỚP CHA QUÁI VẬT: Enemy (Kế thừa từ Entity)
 * Tự động tính toán góc hướng về tọa độ của Player bằng toán học Vector để truy đuổi.
 */
class Enemy extends Entity {
    /**
     * @param {number} x - Hoành độ xuất hiện
     * @param {number} y - Tung độ xuất hiện
     * @param {number} radius - Bán kính hình tròn va chạm
     * @param {string} color - Màu sắc đặc trưng của loại quái
     * @param {number} speed - Tốc độ truy đuổi (pixel / giây)
     * @param {number} hp - Lượng máu tối đa
     * @param {number} damage - Sát thương gây ra khi chạm vào Player
     * @param {number} expValue - Lượng kinh nghiệm rơi ra khi chết
     * @param {number} goldChance - Xác suất rơi đồng xu vàng (0.0 -> 1.0)
     * @param {number} scoreValue - Điểm số cộng thêm khi tiêu diệt
     */
    constructor(x, y, radius, color, speed, hp, damage, expValue, goldChance, scoreValue) {
        super(x, y, radius, color, speed);
        this.maxHp = hp;
        this.hp = hp;
        this.damage = damage;
        this.expValue = expValue;
        this.goldChance = goldChance;
        this.scoreValue = scoreValue;
        this.angleToPlayer = 0;
    }

    /**
     * Cập nhật vị trí quái vật: Tự động di chuyển đuổi theo tọa độ của Player bằng Vector
     * @param {number} dt - Delta Time (giây)
     * @param {Player} player - Đối tượng người chơi cần truy đuổi
     */
    update(dt, player) {
        // Tính góc hướng từ Quái vật (this.x, this.y) tới Người chơi (player.x, player.y)
        // thông qua hàm calculateAngle (Math.atan2(dy, dx)) trong js/math.js
        this.angleToPlayer = calculateAngle(this.x, this.y, player.x, player.y);

        // Dịch chuyển tọa độ x, y theo hình chiếu vector vận tốc:
        // vx = speed * cos(θ), vy = speed * sin(θ)
        this.x += Math.cos(this.angleToPlayer) * this.speed * dt;
        this.y += Math.sin(this.angleToPlayer) * this.speed * dt;
    }

    /**
     * Vẽ thanh máu nhỏ phía trên đầu quái vật khi bị trúng đạn mất máu
     * @param {CanvasRenderingContext2D} ctx
     */
    drawHealthBar(ctx) {
        if (this.hp >= this.maxHp) return;
        const barWidth = this.radius * 2.2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 12;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = this.color;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        ctx.restore();
    }

    /**
     * Vẽ trực quan vòng tròn Hitbox và đường thẳng nối từ Quái vật tới Người chơi
     * khi bật chế độ Debug Mode (Phím F) để minh họa Vector hướng đi khi thuyết trình.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Player} player
     */
    drawDebugVector(ctx, player) {
        // Vẽ vòng tròn Hitbox kế thừa từ lớp cha Entity
        this.drawDebugHitbox(ctx);

        ctx.save();
        // 1. Vẽ đường thẳng nối từ tâm Quái vật tới tâm Player
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(player.x, player.y);
        ctx.strokeStyle = 'rgba(255, 238, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. Vẽ đoạn thẳng vector vận tốc màu hồng đậm ngay trước mặt quái vật
        const vecLen = this.radius + 22;
        const vx = this.x + Math.cos(this.angleToPlayer) * vecLen;
        const vy = this.y + Math.sin(this.angleToPlayer) * vecLen;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(vx, vy);
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

/**
 * ============================================================================
 * LỚP CON 1 (ĐA HÌNH): FastEnemy
 * Đặc điểm: Nhỏ (radius = 12), chạy nhanh, ít máu, màu vàng Neon (#ffee00).
 * Ghi đè phương thức draw() để vẽ phi thuyền mũi nhọn lao thẳng về phía Player.
 * ============================================================================
 */
class FastEnemy extends Enemy {
    constructor(x, y, difficultyMultiplier = 1) {
        super(
            x,
            y,
            12,                                // Bán kính nhỏ (12px)
            '#ffee00',                         // Màu vàng Neon
            165 + difficultyMultiplier * 10,   // Tốc độ chạy rất nhanh
            30 * difficultyMultiplier,         // Lượng máu ít
            10,                                // Sát thương va chạm
            12,                                // Kinh nghiệm rơi ra
            0.35,                              // 35% tỉ lệ rơi vàng
            20                                 // Điểm thưởng
        );
    }

    /**
     * Ghi đè (Override) phương thức draw thể hiện tính Đa hình:
     * Vẽ hình mũi tên sắc nhọn xoay mũi theo góc truy đuổi angleToPlayer.
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angleToPlayer);

        ctx.beginPath();
        ctx.moveTo(this.radius + 4, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.85);
        ctx.lineTo(-this.radius * 0.4, 0);
        ctx.lineTo(-this.radius, this.radius * 0.85);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();

        this.drawHealthBar(ctx);
    }
}

/**
 * ============================================================================
 * LỚP CON 2 (ĐA HÌNH): TankEnemy
 * Đặc điểm: To (radius = 24), chạy chậm, nhiều máu, màu tím Neon (#b829ff).
 * Ghi đè cả update() và draw() để tạo hiệu ứng giáp lục giác hạng nặng tự xoay.
 * ============================================================================
 */
class TankEnemy extends Enemy {
    constructor(x, y, difficultyMultiplier = 1) {
        super(
            x,
            y,
            24,                                // Bán kính lớn (24px)
            '#b829ff',                         // Màu tím Neon
            75 + difficultyMultiplier * 4,     // Tốc độ di chuyển chậm
            140 * difficultyMultiplier,        // Máu trâu gấp gần 5 lần FastEnemy
            22,                                // Sát thương va chạm cao
            30,                                // Rơi nhiều EXP
            0.75,                              // 75% tỉ lệ rơi vàng
            50                                 // Điểm thưởng cao
        );
        this.rotationAngle = 0;
    }

    /**
     * Ghi đè phương thức update: Gọi super.update() để di chuyển đuổi theo Player,
     * đồng thời cập nhật góc tự xoay của lớp vỏ giáp lục giác.
     */
    update(dt, player) {
        super.update(dt, player);
        this.rotationAngle += 1.2 * dt;
    }

    /**
     * Ghi đè phương thức draw: Vẽ khối lục giác bọc thép phát sáng màu tím
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);

        ctx.beginPath();
        const sides = 6;
        for (let i = 0; i < sides; i++) {
            const theta = (i * 2 * Math.PI) / sides;
            const px = Math.cos(theta) * this.radius;
            const py = Math.sin(theta) * this.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = '#240838';
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // Vẽ lõi năng lượng tím bên trong
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
        this.drawHealthBar(ctx);
    }
}

/**
 * ============================================================================
 * LỚP CON 3 (ĐA HÌNH): BossEnemy
 * Đặc điểm: Rất to (radius = 42), máu cực trâu, xuất hiện định kỳ mỗi 30 giây,
 * màu đỏ rực (#ff1744), có hành vi riêng biệt là BẮN ĐẠN về phía người chơi.
 * ============================================================================
 */
class BossEnemy extends Enemy {
    constructor(x, y, difficultyMultiplier = 1) {
        super(
            x,
            y,
            42,                                // Bán kính khổng lồ (42px)
            '#ff1744',                         // Màu đỏ rực Neon
            62 + difficultyMultiplier * 3,     // Tốc độ áp sát ổn định
            750 * difficultyMultiplier,        // Lượng máu cực lớn
            35,                                // Sát thương va chạm rất mạnh
            150,                               // Rơi lượng EXP khổng lồ
            1.0,                               // Chắc chắn 100% rơi 5 đồng vàng lớn
            300                                // Điểm thưởng tiêu diệt Boss
        );
        this.shootCooldown = 1.6;              // Chu kỳ bắn đạn mỗi 1.6 giây
        this.shootTimer = 1.0;
        this.attackPattern = 0;                // Luân phiên giữa bắn chùm 3 tia và bắn tỏa 8 hướng
        this.auraRotation = 0;
    }

    /**
     * Ghi đè phương thức update: Vừa di chuyển áp sát Player, vừa đếm thời gian
     * để tự động khai hỏa bắn đạn về phía người chơi.
     */
    update(dt, player, enemyProjectiles) {
        super.update(dt, player);
        this.auraRotation -= 1.8 * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && enemyProjectiles) {
            this.shootTimer = this.shootCooldown;
            this.fireAtPlayer(player, enemyProjectiles);
        }
    }

    /**
     * Phương thức tấn công đặc trưng của BossEnemy:
     * Sử dụng hàm calculateAngle (Math.atan2) để nhắm bắn đạn đỏ về phía Player.
     */
    fireAtPlayer(player, enemyProjectiles) {
        const baseAngle = calculateAngle(this.x, this.y, player.x, player.y);

        if (this.attackPattern % 2 === 0) {
            // Kiểu 1: Bắn chùm 3 viên đạn nhắm thẳng vào vị trí hiện tại của Player
            const angles = [baseAngle - 0.18, baseAngle, baseAngle + 0.18];
            angles.forEach((angle) => {
                enemyProjectiles.push(
                    new Projectile(
                        this.x + Math.cos(angle) * (this.radius + 8),
                        this.y + Math.sin(angle) * (this.radius + 8),
                        7,
                        '#ff1744',
                        310,
                        angle,
                        18,
                        true // Đánh dấu là đạn của Boss (isEnemy = true)
                    )
                );
            });
        } else {
            // Kiểu 2: Bắn 8 viên đạn tỏa tròn 360 độ xung quanh Boss
            const bulletCount = 8;
            for (let i = 0; i < bulletCount; i++) {
                const angle = baseAngle + (i * Math.PI * 2) / bulletCount;
                enemyProjectiles.push(
                    new Projectile(
                        this.x + Math.cos(angle) * (this.radius + 8),
                        this.y + Math.sin(angle) * (this.radius + 8),
                        6,
                        '#ff5252',
                        260,
                        angle,
                        15,
                        true
                    )
                );
            }
        }
        this.attackPattern++;
    }

    /**
     * Ghi đè phương thức draw: Vẽ Boss với vòng gai năng lượng xoay, nòng pháo lớn
     * và thanh máu Boss hiển thị số máu trực tiếp trên đầu.
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Vẽ vòng gai chiến đấu 8 đỉnh xoay quanh thân Boss
        ctx.save();
        ctx.rotate(this.auraRotation);
        const spikes = 8;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? this.radius + 8 : this.radius - 6;
            const angle = (i * Math.PI) / spikes;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 23, 68, 0.28)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.restore();

        // Vẽ nòng pháo và lõi Boss xoay hướng về phía Player
        ctx.rotate(this.angleToPlayer);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, -6, this.radius + 6, 12);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();

        // Vẽ thanh máu riêng của Boss kèm chỉ số HP hiện tại
        const barWidth = 96;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 22;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = '#ff1744';
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS [${Math.ceil(this.hp)}]`, this.x, barY - 4);
        ctx.restore();
    }
}

