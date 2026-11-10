/**
 * ============================================================================
 * FILE: js/math.js
 * MÔ TẢ: Thư viện các hàm toán học 2D cốt lõi phục vụ tính toán Vector,
 *        khoảng cách Euclid, góc lượng giác và phát hiện va chạm hình tròn.
 * LƯU Ý: Không dùng import/export để chạy trực tiếp qua giao thức file://
 *        mà không bị chặn bởi lỗi CORS trên trình duyệt.
 * ============================================================================
 */

/**
 * 1. TÍNH KHOẢNG CÁCH EUCLID GIỮA HAI ĐIỂM A(x1, y1) VÀ B(x2, y2)
 * Công thức: d = √((x2 - x1)² + (y2 - y1)²) = Math.hypot(x2 - x1, y2 - y1)
 * Ứng dụng:
 * - Tính khoảng cách từ Ngọc EXP / Vàng tới Player để kích hoạt lực hút từ trường.
 * - Tính khoảng cách giữa tâm 2 thực thể để xét va chạm hình tròn.
 *
 * @param {number} x1 - Hoành độ điểm thứ nhất
 * @param {number} y1 - Tung độ điểm thứ nhất
 * @param {number} x2 - Hoành độ điểm thứ hai
 * @param {number} y2 - Tung độ điểm thứ hai
 * @returns {number} Khoảng cách giữa 2 điểm (pixel)
 */
function calculateDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * 2. TÍNH GÓC ĐỊNH HƯỚNG TỪ ĐIỂM NGUỒN (x1, y1) TỚI ĐIỂM ĐÍCH (x2, y2)
 * Công thức lượng giác: θ = Math.atan2(y2 - y1, x2 - x1)
 * Giá trị trả về nằm trong khoảng [-π, π] (đơn vị Radian).
 * Ứng dụng:
 * - Xoay nòng súng của Player hướng chính xác về phía con trỏ chuột.
 * - Tính góc để Quái vật (Enemy) luôn di chuyển đuổi theo tọa độ của Player.
 * - Tính góc bắn đạn của BossEnemy về phía Player.
 *
 * @param {number} x1 - Hoành độ điểm xuất phát
 * @param {number} y1 - Tung độ điểm xuất phát
 * @param {number} x2 - Hoành độ điểm mục tiêu
 * @param {number} y2 - Tung độ điểm mục tiêu
 * @returns {number} Góc hướng đi tính bằng Radian
 */
function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * 3. CHUẨN HÓA VECTOR ĐƠN VỊ (VECTOR NORMALIZATION)
 * Khi người chơi giữ cùng lúc 2 phím di chuyển chéo (ví dụ W + D),
 * vector tổng hợp là (1, -1) có độ dài √(1² + (-1)²) = √2 ≈ 1.414.
 * Nếu không chuẩn hóa, nhân vật đi chéo sẽ nhanh hơn đi thẳng 41.4%.
 * Công thức chuẩn hóa: u = (vx / |v|, vy / |v|) sao cho độ dài vector luôn bằng 1.
 *
 * @param {number} vx - Thành phần vector theo trục X
 * @param {number} vy - Thành phần vector theo trục Y
 * @returns {{x: number, y: number}} Vector đơn vị đã chuẩn hóa
 */
function normalizeVector(vx, vy) {
    const length = Math.hypot(vx, vy);
    if (length === 0) {
        return { x: 0, y: 0 };
    }
    return {
        x: vx / length,
        y: vy / length
    };
}

/**
 * 4. KIỂM TRA VA CHẠM GIỮA HAI HÌNH TRÒN (CIRCLE-TO-CIRCLE COLLISION DETECTION)
 * Hai thực thể hình tròn tâm A(x1, y1) bán kính R1 và tâm B(x2, y2) bán kính R2
 * va chạm với nhau khi và chỉ khi khoảng cách giữa hai tâm nhỏ hơn tổng hai bán kính:
 * d = Math.hypot(entityA.x - entityB.x, entityA.y - entityB.y) < (entityA.radius + entityB.radius)
 *
 * @param {Entity} entityA - Thực thể thứ nhất (có x, y, radius)
 * @param {Entity} entityB - Thực thể thứ hai (có x, y, radius)
 * @returns {boolean} true nếu 2 hình tròn giao nhau (va chạm)
 */
function checkCircleCollision(entityA, entityB) {
    const distance = calculateDistance(entityA.x, entityA.y, entityB.x, entityB.y);
    return distance < (entityA.radius + entityB.radius);
}

/**
 * 5. GIỚI HẠN GIÁ TRỊ TRONG ĐOẠN [min, max] (CLAMP)
 * Ứng dụng: Giữ tọa độ (x, y) của Player không bao giờ vượt ra khỏi khung hình Canvas.
 *
 * @param {number} value - Giá trị cần giới hạn
 * @param {number} min - Giá trị nhỏ nhất cho phép
 * @param {number} max - Giá trị lớn nhất cho phép
 * @returns {number} Giá trị nằm trong đoạn [min, max]
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 6. CHUYỂN ĐỔI GÓC TỪ RADIAN SANG ĐỘ (DEGREE)
 * Công thức: deg = rad * (180 / π)
 * Ứng dụng: Hiển thị góc ngắm dễ đọc trên bảng thông số Debug Mode khi thuyết trình.
 *
 * @param {number} rad - Góc tính bằng Radian
 * @returns {number} Góc tính bằng Độ
 */
function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

