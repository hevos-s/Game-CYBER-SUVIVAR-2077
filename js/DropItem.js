/**
 * ============================================================================
 * FILE: js/DropItem.js
 * MÔ TẢ: Định nghĩa các lớp vật phẩm rơi ra khi quái vật bị tiêu diệt:
 *        - ExperienceGem (Ngọc kinh nghiệm giúp Player lên cấp)
 *        - GoldCoin (Đồng xu vàng dùng để nâng cấp chỉ số & mua Skin trong Shop)
 * TÍNH CHẤT HƯỚNG ĐỐI TƯỢNG (OOP) ĐỂ BÁO CÁO:
 * - Kế thừa (Inheritance): Cả `ExperienceGem` và `GoldCoin` đều kế thừa từ `Entity`.
 * - Đa hình (Polymorphism): Ghi đè `draw(ctx)` để vẽ viên ngọc lục bảo hình thoi
 *   co giãn nhịp nhàng (pulse) và đồng xu vàng có ký hiệu `$`.
 * - Toán học Vector & Lực hút từ trường (Magnet Pull):
 *   Sử dụng `calculateDistance` (Math.hypot) và `calculateAngle` (Math.atan2) từ `js/math.js`
 *   để tự động bay hút vào Player khi Player tiến lại gần trong bán kính `magnetRadius`.
 * ============================================================================
 */

/**
 * 1. CLASS EXPERIENCEGEM (NGỌC KINH NGHIỆM)
 */
class ExperienceGem extends Entity {
    /**
     * @param {number} x - Hoành độ nơi quái vật vừa chết
     * @param {number} y - Tung độ nơi quái vật vừa chết
     * @param {number} expValue - Lượng điểm kinh nghiệm cộng cho Player khi nhặt
     */
    constructor(x, y, expValue = 15) {
        super(x, y, 7, '#00ff66', 380);
        this.expValue = expValue;
        this.pulseTimer = Math.random() * Math.PI * 2;
    }

    /**
     * Kiểm tra khoảng cách tới Player bằng hàm calculateDistance (Math.hypot).
     * Nếu khoảng cách nhỏ hơn bán kính từ trường (player.magnetRadius),
     * ngọc sẽ tự động tính góc hướng về Player (Math.atan2) và tăng tốc lao vào Player.
     */
    update(dt, player) {
        this.pulseTimer += 5 * dt;

        // Tính khoảng cách Euclid từ viên ngọc tới tâm Player
        const dist = calculateDistance(this.x, this.y, player.x, player.y);

        if (dist < player.magnetRadius) {
            // Tính góc hướng từ viên ngọc tới Player bằng hàm Math.atan2
            const angle = calculateAngle(this.x, this.y, player.x, player.y);

            // Càng gần Player thì tốc độ hút càng mạnh
            const pullSpeed = this.speed + (player.magnetRadius - dist) * 2.2;
            this.x += Math.cos(angle) * pullSpeed * dt;
            this.y += Math.sin(angle) * pullSpeed * dt;
        }
    }

    /**
     * Ghi đè phương thức draw: Vẽ viên ngọc hình thoi phát sáng xanh lá cây
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Hiệu ứng nhịp thở phóng to - thu nhỏ nhẹ bằng hàm lượng giác Math.sin
        const scale = 1 + Math.sin(this.pulseTimer) * 0.15;
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius, 0);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

/**
 * 2. CLASS GOLDCOIN (ĐỒNG XU VÀNG)
 */
class GoldCoin extends Entity {
    /**
     * @param {number} x - Hoành độ nơi rơi đồng vàng
     * @param {number} y - Tung độ nơi rơi đồng vàng
     * @param {number} goldValue - Số lượng vàng nhận được khi nhặt
     */
    constructor(x, y, goldValue = 10) {
        super(x, y, 8, '#ffee00', 380);
        this.goldValue = goldValue;
        this.pulseTimer = Math.random() * Math.PI * 2;
    }

    /**
     * Tự động bị hút vào Player khi nằm trong bán kính từ trường magnetRadius
     */
    update(dt, player) {
        this.pulseTimer += 6 * dt;

        const dist = calculateDistance(this.x, this.y, player.x, player.y);
        if (dist < player.magnetRadius) {
            const angle = calculateAngle(this.x, this.y, player.x, player.y);
            const pullSpeed = this.speed + (player.magnetRadius - dist) * 2.2;
            this.x += Math.cos(angle) * pullSpeed * dt;
            this.y += Math.sin(angle) * pullSpeed * dt;
        }
    }

    /**
     * Ghi đè phương thức draw: Vẽ đồng xu vàng Neon kèm ký hiệu '$' ở chính giữa
     */
    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', this.x, this.y + 0.5);
        ctx.restore();
    }
}

