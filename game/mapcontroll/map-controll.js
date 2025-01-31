const mapContainer = document.getElementById("map-container");
let scale = 1; // 初期ズーム
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let zoomFactor = 0.05; // ズームの感度

mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

// **ページスクロールを禁止**
document.body.style.overflow = "hidden";

// **ズーム（ブラウザの中心を軸に拡大縮小、最小サイズ1.0に制限）**
window.addEventListener(
    "wheel",
    (e) => {
        e.preventDefault();

        let newScale = scale;
        if (e.deltaY < 0) {
            newScale = Math.min(scale + zoomFactor, 3); // 最大3倍まで
        } else {
            newScale = Math.max(scale - zoomFactor, 1); // 最小1倍まで
        }

        // ブラウザの中心を基準にズーム
        const rect = mapContainer.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = (centerX - rect.left - rect.width / 2) * (newScale / scale - 1);
        const offsetY = (centerY - rect.top - rect.height / 2) * (newScale / scale - 1);

        translateX -= offsetX;
        translateY -= offsetY;
        scale = newScale;

        requestAnimationFrame(updateTransform);
    },
    { passive: false }
);

// **クリック＆ドラッグでマップ移動（画面端から離れないように制限）**
mapContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    requestAnimationFrame(updateTransform);
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

// **ウィンドウリサイズ時にマップサイズを調整**
window.addEventListener("resize", updateTransform);

// **マップがブラウザからはみ出さないように調整**
function updateTransform() {
    const mapWidth = mapContainer.offsetWidth * scale;
    const mapHeight = mapContainer.offsetHeight * scale;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // マップが画面より小さい場合、中央に固定
    if (mapWidth <= screenWidth) {
        translateX = 0;
    } else {
        const maxTranslateX = (mapWidth - screenWidth) / 2;
        translateX = Math.min(Math.max(translateX, -maxTranslateX), maxTranslateX);
    }

    if (mapHeight <= screenHeight) {
        translateY = 0;
    } else {
        const maxTranslateY = (mapHeight - screenHeight) / 2;
        translateY = Math.min(Math.max(translateY, -maxTranslateY), maxTranslateY);
    }

    mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}
