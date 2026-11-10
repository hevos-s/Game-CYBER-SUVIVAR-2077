/**
 * ============================================================================
 * FILE: js/Entity.js
 * MÔ TẢ: Định nghĩa lớp cha cơ sở (Base Class) Entity cho mọi thực thể 2D
 *        xuất hiện trên màn hình Canvas.
 * TÍNH CHẤT HƯỚNG ĐỐI TƯỢNG (OOP) ĐỂ BÁO CÁO:
 * 1. Tính Đóng Gói (Encapsulation):
 *    - Gom nhóm các thuộc tính vật lý chung của mọi vật thể 2D: tọa độ (x, y),
 *      bán kính vùng va chạm hình tròn (radius), màu sắc Neon (color), tốc độ (speed)
 *      và cờ đánh dấu xóa khỏi bộ nhớ (markedForDeletion) vào cùng một lớp.
 * 2. Tính Kế Thừa (Inheritance):
 *    - Là lớp cha (Superclass) để các lớp con `Player`, `Enemy`, `Projectile`,
 *      `Particle`, `ExperienceGem`, `GoldCoin` kế thừa thông qua từ khóa `extends`,
 *      giúp tái sử dụng mã nguồn và tránh lặp lại khai báo thuộc tính tọa độ/bán kính.
 * 3. Tính Đa Hình (Polymorphism):
 *    - Định nghĩa phương thức khuôn mẫu `draw(ctx)` và `update(dt)` để mỗi lớp con
 *      có thể ghi đè (override) theo cách hiển thị và di chuyển riêng biệt.
 * ============================================================================
 */

class Entity {
    /**
     * Khởi tạo một thực thể 2D cơ bản
     * @param {number} x - Hoành độ tâm thực thể trên Canvas
     * @param {number} y - Tung độ tâm thực thể trên Canvas
     * @param {number} radius - Bán kính hình tròn Hitbox (dùng để vẽ và kiểm tra va chạm)
     * @param {string} color - Mã màu HEX/RGB phát sáng Neon
     * @param {number} speed - Tốc độ di chuyển cơ bản (pixel / giây)
     */
    constructor(x, y, radius, color, speed = 0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.markedForDeletion = false; // Cờ đánh dấu đối tượng cần được dọn dẹp khỏi mảng
    }

    /**
     * Phương thức vẽ mặc định của Entity (Vẽ hình tròn phát sáng bằng shadowBlur).
     * Các lớp con như Player, FastEnemy, TankEnemy, BossEnemy sẽ ghi đè (override)
     * phương thức này để thể hiện tính Đa hình trong đồ họa.
     * @param {CanvasRenderingContext2D} ctx - Ngữ cảnh vẽ 2D của thẻ Canvas
     */
    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }

    /**
     * Phương thức cập nhật trạng thái vật lý mỗi khung hình (Frame).
     * Lớp con sẽ ghi đè phương thức này để định nghĩa công thức di chuyển riêng.
     * @param {number} dt - Thời gian trôi qua giữa 2 khung hình (Delta Time tính bằng giây)
     */
    update(dt) {
        // Được định nghĩa cụ thể ở các lớp kế thừa (Player, Enemy, Projectile...)
    }

    /**
     * Phương thức chung vẽ vòng tròn Hitbox trực quan khi bật chế độ Debug Mode (Phím F).
     * Nhờ tính Kế thừa, mọi lớp con đều tự động có khả năng hiển thị Hitbox mà không cần viết lại.
     * @param {CanvasRenderingContext2D} ctx
     */
    drawDebugHitbox(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();

        // Vẽ điểm tâm tọa độ (x, y) chính xác của thực thể
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 1.5, this.y - 1.5, 3, 3);
        ctx.restore();
    }
}

