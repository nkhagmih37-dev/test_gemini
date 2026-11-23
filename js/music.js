/* js/music.js  (MỚI)
   Nút nhạc nền cho toàn bộ web. Mỗi trang chỉ cần 1 dòng trong <head>:
     <script src="/js/music.js" defer></script>
   Việc cần chỉnh nằm ở 3 hằng số ngay dưới đây. */

(() => {
  const AUDIO_SRC = '/audio/bg-music.mp3';  // <- file nhạc của bạn
  const ICON_SRC  = '/img/music.png';       // <- biểu tượng bạn chọn
  const VOLUME    = 0.05;                    // 0 (câm) -> 1 (to nhất)

  const KEY_ON   = 'bgm-on';    // nhớ người dùng đang bật hay tắt
  const KEY_TIME = 'bgm-time';  // nhớ đang phát tới giây thứ mấy

  // localStorage có thể bị chặn (chế độ ẩn danh...), nên bọc try/catch
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } }
  };

  const audio = new Audio(AUDIO_SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = 'auto';

  // Tạo nút
  const btn = document.createElement('button');
  btn.className = 'music-btn';
  btn.type = 'button';
  btn.innerHTML = `<img class="music-icon" src="${ICON_SRC}" alt="">`;
  document.body.appendChild(btn);

  function setUI(on) {
    btn.classList.toggle('is-playing', on);
    btn.setAttribute('aria-pressed', String(on));
    const label = on ? 'Tắt nhạc nền' : 'Bật nhạc nền';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }
  setUI(false);

  // Khôi phục vị trí phát ở trang trước
  const savedTime = parseFloat(store.get(KEY_TIME));
  if (!Number.isNaN(savedTime)) {
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration) audio.currentTime = savedTime % audio.duration;
    }, { once: true });
  }

  let waitingForGesture = false;

  function stopWaiting() {
    waitingForGesture = false;
    removeEventListener('pointerdown', onFirstGesture);
    removeEventListener('keydown', onFirstGesture);
  }

  async function play() {
    try {
      await audio.play();
      setUI(true);
      store.set(KEY_ON, '1');
      stopWaiting();
      return true;
    } catch {
      return false; // trình duyệt chặn tự phát
    }
  }

  function pause() {
    audio.pause();
    setUI(false);
    store.set(KEY_ON, '0');
    stopWaiting();
  }

  btn.addEventListener('click', () => (audio.paused ? play() : pause()));

  // Trình duyệt chặn tự phát nhạc khi chưa có tương tác: đợi lần bấm/phím đầu tiên
  function onFirstGesture(e) {
    if (btn.contains(e.target)) return; // để nút tự xử lý
    play();
  }

  // Trang mới mở: nếu lần trước người dùng đang bật thì phát tiếp
  if (store.get(KEY_ON) === '1') {
    play().then(ok => {
      if (!ok) {
        waitingForGesture = true;
        addEventListener('pointerdown', onFirstGesture);
        addEventListener('keydown', onFirstGesture);
      }
    });
  }

  // Lưu vị trí phát khi rời trang / chuyển tab
  const saveTime = () => store.set(KEY_TIME, String(audio.currentTime || 0));
  addEventListener('pagehide', saveTime);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveTime();
  });
})();
