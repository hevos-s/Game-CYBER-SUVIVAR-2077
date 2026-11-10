/**
 * ============================================================================
 * FILE: js/Projectile.js
 * MÔ TẢ: Định nghĩa lớp Projectile (Đạn bắn ra từ Player hoặc Boss) và
 *        lớp Particle (Hiệu ứng hạt nổ tung khi quái vật trúng đạn / bị tiêu diệt).
 * TÍNH CHẤT HƯỚNG ĐỐI TƯỢNG (OOP) ĐỂ BÁO CÁO:
 * - Kế thừa (Inheritance): Cả `Projectile` và `Particle` đều kế thừa từ lớp cha
 *   `Entity` (`extends Entity`) và gọi `super(x, y, radius, color, speed)`.
 * - Đa hình (Polymorphism): Ghi đè phương thức `update()` và `draw(ctx)` để:
 *   + `Projectile` bay thẳng theo góc lượng giác `angle` và vẽ vệt sáng đuôi đạn (Trail).
 *   + `Particle` văng ngẫu nhiên 360 độ, chịu lực cản không khí (`friction`) làm chậm dần
 *     và giảm dần độ trong suốt (`alpha`) cho đến khi biến mất.
 * ============================================================================
 */

/**
 * 1. CLASS PROJECTILE (ĐẠN NĂNG LƯỢNG PLASMA)
 * Dùng chung cho cả đạn của Người chơi (`isEnemy = false`) và đạn của Boss (`isEnemy = true`).
 */
class Projectile extends Entity {
    /**
     * @param {number} x - Hoành độ điểm xuất phát (đầu nòng súng)
     * @param {number} y - Tung độ điểm xuất phát (đầu nòng súng)
     * @param {number} radius - Bán kính viên đạn
     * @param {string} color - Màu sắc phát sáng của đạn
     * @param {number} speed - Vận tốc bay của đạn (pixel / giây)
     * @param {number} angle - Góc bắn tính bằng Radian (từ hàm calculateAngle / Math.atan2)
     * @param {number} damage - Sát thương gây ra khi va chạm mục tiêu
     * @param {boolean} isEnemy - Phân biệt đạn của Boss (true) hay đạn của Player (false)
     */
    constructor(x, y, radius, color, speed, angle, damage, isEnemy = false) {
        super(x, y, radius, color, speed);
        this.angle = angle;
        this.damage = damage;
        this.isEnemy = isEnemy;

        // Phân tích vector vận tốc theo 2 trục tọa độ Oxy bằng lượng giác:
        // vx = speed * cos(θ), vy = speed * sin(θ)
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Thời gian tồn tại tối đa (2.5 giây) để tự giải phóng bộ nhớ nếu không trúng đích
        this.lifeTime = 2.5;
    }

    /**
     * Ghi đè phương thức update: Di chuyển viên đạn theo vector vận tốc (vx, vy)
     * và tự đánh dấu xóa (markedForDeletion) khi bay ra khỏi khung hình Canvas.
     */
    update(dt, canvasWidth, canvasHeight) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifeTime -= dt;

        // Xóa đạn khi bay ra ngoài biên màn hình hoặc hết thời gian sống
        if (
            this.lifeTime <= 0 ||
            this.x < -30 ||
            this.x > canvasWidth + 30 ||
            this.y < -30 ||
            this.y > canvasHeight + 30
        ) {
            this.markedForDeletion = true;
        }
    }

    /**
     * Ghi đè phương thức draw: Vẽ viên đạn kèm hiệu ứng đuôi ánh sáng (Bullet Trail)
     */
    draw(ctx) {
        ctx.save();
        ctx.beginPath();

        // Tính tọa độ điểm đuôi vệt sáng ngược chiều góc bay một đoạn 14px
        const tailX = this.x - Math.cos(this.angle) * 14;
        const tailY = this.y - Math.sin(this.angle) * 14;

        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 1.4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // Vẽ phần lõi đầu đạn màu trắng rực
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
    }
}

/**
 * 2. CLASS PARTICLE (HẠT NỔ TUNG KHI QUÁI VẬT BỊ TIÊU DIỆT)
 * Tạo hiệu ứng pháo hoa Neon văng ra mọi hướng giúp đồ họa bắt mắt.
 */
class Particle extends Entity {
    /**
     * @param {number} x - Hoành độ tâm vụ nổ
     * @param {number} y - Tung độ tâm vụ nổ
     * @param {string} color - Màu sắc của hạt nổ (lấy theo màu của quái vật)
     */
    constructor(x, y, color) {
        const radius = Math.random() * 3.5 + 1.5;
        const speed = Math.random() * 220 + 50;
        super(x, y, radius, color, speed);

        // Chọn góc văng ngẫu nhiên trong khoảng [0, 2π] radian (360 độ)
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.alpha = 1.0;                        // Độ trong suốt ban đầu (100%)
        this.decay = Math.random() * 1.6 + 1.2;  // Tốc độ mờ dần mỗi giây
        this.friction = 0.94;                    // Hệ số ma sát làm hạt giảm tốc dần
    }

    /**
     * Ghi đè phương thức update: Giảm vận tốc do ma sát và giảm dần độ trong suốt alpha
     */
    update(dt) {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.alpha -= this.decay * dt;

        // Khi hạt đã mờ hẳn (alpha <= 0), đánh dấu xóa để giải phóng khỏi mảng
        if (this.alpha <= 0) {
            this.markedForDeletion = true;
        }
    }

    /**
     * Ghi đè phương thức draw: Vẽ hạt phát sáng với độ trong suốt globalAlpha giảm dần
     */
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

