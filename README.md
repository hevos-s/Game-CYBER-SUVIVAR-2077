# CYBER SURVIVOR 2077 - 2D Top-Down Survival Shooter

**Bài tập lớn học phần: Thực tập cơ sở ngành Công nghệ thông tin**  
**Công nghệ sử dụng:** HTML5 Canvas API, CSS3, Vanilla JavaScript (ES6 Classes - Lập trình Hướng đối tượng OOP), Web Audio API, LocalStorage API.

---

## 1. Hướng Dẫn Chạy Chương Trình (Không Cần Cài Đặt Server)

Dự án được thiết kế theo kiến trúc đa file chuẩn mực và nạp theo thứ tự phụ thuộc qua thẻ `<script>` tiêu chuẩn (không dùng `type="module"` hay bundler) để **tránh hoàn toàn lỗi chặn CORS** khi mở trực tiếp từ ổ cứng:

1. Mở thư mục dự án trên máy tính.
2. Nháy đúp chuột trực tiếp vào file **`index.html`** (chạy qua giao thức `file://` trên Chrome, Edge, Firefox, Safari).
3. Nhấn nút **`▶ BẮT ĐẦU CHIẾN ĐẤU`** để vào game.

---

## 2. Cấu Trúc Thư Mục Dự Án

```text
project game thực tập cơ sở/
├── index.html          # Khung giao diện HTML5, thẻ <canvas> và nạp các file JS theo thứ tự phụ thuộc
├── README.md           # Tài liệu thuyết minh kiến trúc OOP, thuật toán và hướng dẫn bảo vệ đồ án
├── css/
│   └── style.css       # Định dạng giao diện Cyberpunk / Neon Dark Mode, HUD, Shop & Debug Panel
└── js/
    ├── math.js         # Các hàm toán học Vector 2D, khoảng cách Euclid, góc lượng giác, va chạm hình tròn
    ├── audio.js        # Class SoundManager tạo hiệu ứng âm thanh bằng tần số sóng âm Web Audio API
    ├── Entity.js       # Class cha cơ sở Entity (x, y, radius, color, speed, draw, update, drawDebugHitbox)
    ├── Projectile.js   # Class Projectile (Đạn của Player/Boss) và Class Particle (Hạt nổ tung)
    ├── DropItem.js     # Class ExperienceGem (Ngọc kinh nghiệm) và Class GoldCoin (Đồng xu vàng)
    ├── Player.js       # Class Player (Nhân vật người chơi, điều khiển WASD, ngắm bắn 360 độ)
    ├── Enemy.js        # Class Enemy và 3 lớp con Đa hình: FastEnemy, TankEnemy, BossEnemy
    ├── Game.js         # Class Game (Quản lý vòng lặp requestAnimationFrame, State Pattern, Shop, Debug Mode)
    └── main.js         # Điểm khởi đầu (Entry Point): Khởi tạo Game, lắng nghe sự kiện phím/chuột
```

---

## 3. Phân Tích Thiết Kế Hướng Đối Tượng (OOP) Dùng Cho Báo Cáo

### 3.1. Tính Đóng Gói (Encapsulation)
- Mỗi thực thể trong game được đóng gói thành một `Class` độc lập trong một file riêng biệt, chứa các thuộc tính dữ liệu và phương thức xử lý nội tại:
  - `SoundManager` (`js/audio.js`): Đóng gói `AudioContext`, trạng thái bật/tắt âm thanh (`enabled`) và các phương thức phát sóng âm (`playShoot`, `playExplosion`, `playPickup`, `playLevelUp`, `playBossWarning`, `playGameOver`).
  - `Game` (`js/Game.js`): Đóng gói toàn bộ danh sách thực thể (`player`, `enemies`, `projectiles`, `particles`, `gems`, `coins`), trạng thái trò chơi (`state`) và dữ liệu lưu trữ (`saveData`).

### 3.2. Tính Kế Thừa (Inheritance)
- Lớp cha **`Entity`** (`js/Entity.js`) định nghĩa các thuộc tính gốc của mọi đối tượng 2D trên mặt phẳng tọa độ Canvas:
  - Thuộc tính: `x`, `y`, `radius`, `color`, `speed`, `markedForDeletion`.
  - Phương thức: `draw(ctx)`, `update(dt)`, `drawDebugHitbox(ctx)`.
- Các lớp con kế thừa trực tiếp từ `Entity` bằng từ khóa `extends` và gọi `super(...)`:
  - `Player extends Entity` (`js/Player.js`)
  - `Enemy extends Entity` (`js/Enemy.js`)
  - `Projectile extends Entity` (`js/Projectile.js`)
  - `Particle extends Entity` (`js/Projectile.js`)
  - `ExperienceGem extends Entity` & `GoldCoin extends Entity` (`js/DropItem.js`)

### 3.3. Tính Đa Hình (Polymorphism)
- Từ lớp `Enemy` (`js/Enemy.js`), chương trình xây dựng 3 lớp con kế thừa thể hiện tính Đa hình rõ rệt cả về hình dáng đồ họa (`draw`) lẫn hành vi chiến đấu (`update`):
  1. **`FastEnemy extends Enemy`**: Kích thước nhỏ (`radius = 12`), tốc độ chạy rất nhanh, ít máu, màu vàng Neon (`#ffee00`). Ghi đè `draw(ctx)` để vẽ phi tiêu tam giác nhọn xoay theo hướng lao tới Player.
  2. **`TankEnemy extends Enemy`**: Kích thước lớn (`radius = 24`), tốc độ chậm, máu trâu, màu tím Neon (`#b829ff`). Ghi đè `update(dt, player)` và `draw(ctx)` để vẽ lớp giáp lục giác hạng nặng tự xoay quanh tâm.
  3. **`BossEnemy extends Enemy`**: Kích thước khổng lồ (`radius = 42`), máu cực lớn, xuất hiện mỗi 30 giây, màu đỏ rực (`#ff1744`). Ghi đè `update(dt, player, enemyProjectiles)` để vừa truy đuổi vừa định kỳ bắn đạn chùm 3 tia và đạn tỏa tròn 8 hướng về phía người chơi.

---

## 4. Giải Thích Các Công Thức Toán Học & Thuật Toán Trong Game (`js/math.js`)

1. **Công thức tính góc hướng đi và góc xoay nòng súng (`Math.atan2`)**:
   - Hàm `calculateAngle(x1, y1, x2, y2)` sử dụng `Math.atan2(y2 - y1, x2 - x1)` trả về góc $\theta \in [-\pi, \pi]$ radian.
   - Từ góc $\theta$, vector vận tốc theo trục $Ox$ và $Oy$ được tính bằng:
     $$v_x = \text{speed} \times \cos(\theta), \quad v_y = \text{speed} \times \sin(\theta)$$

2. **Chuẩn hóa Vector di chuyển chéo (`normalizeVector`)**:
   - Khi nhấn đồng thời 2 phím (ví dụ `W` + `D`), độ dài vector hướng đi là $\sqrt{1^2 + (-1)^2} = \sqrt{2} \approx 1.414$.
   - Chia từng thành phần cho độ dài $\sqrt{v_x^2 + v_y^2}$ giúp tốc độ di chuyển chéo luôn bằng đúng tốc độ đi ngang/dọc.

3. **Phát hiện va chạm hình tròn (`checkCircleCollision` với `Math.hypot`)**:
   - Khoảng cách Euclid giữa tâm hai thực thể $A(x_1, y_1)$ và $B(x_2, y_2)$:
     $$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} = \text{Math.hypot}(x_2 - x_1, y_2 - y_1)$$
   - Hai hình tròn xảy ra va chạm khi và chỉ khi: $d < R_A + R_B$.

---

## 5. Phím Tắt & Chế Độ Debug Mode Khi Thuyết Trình

- **`W, A, S, D`** hoặc **Phím Mũi Tên**: Di chuyển nhân vật.
- **Di chuyển Chuột**: Xoay tháp súng ngắm bắn 360°.
- **Click Chuột Trái** hoặc bật **Tự Động Bắn**: Khai hỏa.
- **Phím `F`** (hoặc nút **"Bật/Tắt Debug Mode (F)"** góc trên phải):
  - Vẽ trực quan vòng tròn **Hitbox** (`radius`) màu xanh lá quanh mọi thực thể.
  - Vẽ vòng tròn bán kính hút ngọc (`magnetRadius`) quanh Player.
  - Vẽ **đường thẳng Vector hướng đi** nối từ tâm mỗi con quái vật tới tâm Player.
  - Hiển thị bảng **Debug Telemetry**: FPS, Frame Time (`ms`), Trạng thái hiện tại (`State`), Tọa độ Player, Góc ngắm `Math.atan2` (`rad` & `độ`), và số lượng từng loại Object đang hoạt động.
  - Cung cấp 3 nút bấm nhanh để demo ngay trước hội đồng chấm thi: **`+ Gọi Boss`**, **`+ Lên Cấp`**, **`+500 Vàng`**.

