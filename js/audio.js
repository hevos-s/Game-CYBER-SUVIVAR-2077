/**
 * ============================================================================
 * FILE: js/audio.js
 * MÔ TẢ: Định nghĩa lớp SoundManager tạo hiệu ứng âm thanh tổng hợp thời gian thực
 *        bằng Web Audio API thuần túy (OscillatorNode & GainNode).
 * TÍNH CHẤT OOP:
 * - Tính Đóng Gói (Encapsulation): Toàn bộ trạng thái bật/tắt âm thanh (enabled),
 *   ngữ cảnh âm thanh (AudioContext) và các thuật toán điều chế tần số sóng âm
 *   được đóng gói kín bên trong lớp SoundManager. Các lớp bên ngoài chỉ cần gọi
 *   các phương thức giao tiếp như playShoot(), playExplosion(), playLevelUp()...
 * ============================================================================
 */

class SoundManager {
    constructor() {
        // Khởi tạo AudioContext tương thích với mọi trình duyệt hiện đại
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = null;
        this.AudioCtxClass = AudioCtx;
        this.enabled = true;
    }

    /**
     * Đảm bảo AudioContext được khởi tạo và đánh thức sau tương tác chuột/phím của người dùng
     * (Tuân thủ chính sách Autoplay Policy của các trình duyệt hiện đại)
     */
    initContext() {
        if (!this.enabled) return false;
        if (!this.ctx && this.AudioCtxClass) {
            this.ctx = new this.AudioCtxClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return Boolean(this.ctx);
    }

    /**
     * Bật / Tắt toàn bộ hiệu ứng âm thanh trong game
     * @returns {boolean} Trạng thái âm thanh sau khi chuyển đổi
     */
    toggleMute() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * 1. Âm thanh khi bắn súng (Laser Pew):
     * Sử dụng sóng răng cưa (sawtooth) giảm tần số nhanh theo hàm mũ từ 780Hz xuống 140Hz
     * trong vòng 0.09 giây, tạo âm thanh tia súng laser đặc trưng.
     */
    playShoot() {
        if (!this.initContext()) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

        gain.gain.setValueAtTime(0.10, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * 2. Âm thanh khi quái vật nổ tung (Explosion):
     * Sử dụng sóng vuông (square) hoặc răng cưa (sawtooth) ở dải tần số trầm (170Hz -> 24Hz)
     * mô phỏng tiếng nổ chấn động khi tiêu diệt quái thường hoặc Boss.
     * @param {boolean} isBoss - Nếu là Boss nổ thì âm lượng lớn hơn và ngân dài hơn (0.55s)
     */
    playExplosion(isBoss = false) {
        if (!this.initContext()) return;
        const now = this.ctx.currentTime;
        const duration = isBoss ? 0.55 : 0.18;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isBoss ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(isBoss ? 120 : 170, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + duration);

        gain.gain.setValueAtTime(isBoss ? 0.28 : 0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * 3. Âm thanh khi nhặt Ngọc Kinh Nghiệm (ExperienceGem) hoặc Đồng Vàng (GoldCoin):
     * Sóng hình sin (sine) trong trẻo tăng tần số tạo cảm giác nhận phần thưởng.
     * @param {boolean} isGold - Nếu nhặt vàng thì phát nốt cao hơn (B5 -> E6)
     */
    playPickup(isGold = false) {
        if (!this.initContext()) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startFreq = isGold ? 987.77 : 587.33; // Nốt B5 hoặc D5
        const endFreq = isGold ? 1318.51 : 880.0;   // Nốt E6 hoặc A5

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * 4. Âm thanh khi Lên cấp (Level Up Fanfare):
     * Phát chuỗi hợp âm Arpeggio (C5 - E5 - G5 - C6) bằng sóng tam giác (triangle).
     */
    playLevelUp() {
        if (!this.initContext()) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const now = this.ctx.currentTime + index * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        });
    }

    /**
     * 5. Âm thanh cảnh báo Boss xuất hiện mỗi 30 giây (Boss Siren):
     * Tạo 2 hồi còi hú tăng dần tần số từ 220Hz lên 440Hz.
     */
    playBossWarning() {
        if (!this.initContext()) return;
        for (let i = 0; i < 2; i++) {
            const now = this.ctx.currentTime + i * 0.26;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(440, now + 0.20);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.24);
        }
    }

    /**
     * 6. Âm thanh khi Game Over:
     * Chuỗi 4 nốt trầm giảm dần (G4 -> F4 -> Eb4 -> C4) báo hiệu thất bại.
     */
    playGameOver() {
        if (!this.initContext()) return;
        const notes = [392.00, 349.23, 311.13, 261.63];
        notes.forEach((freq, index) => {
            const now = this.ctx.currentTime + index * 0.16;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.32);
        });
    }
}

