const mapContainer = document.getElementById("map-container");
let scale = 1.8; // 初期ズーム（庭を90%に表示）
let isDragging = false;
let startX, startY, translateX = -1900, translateY = -1350; // 初期位置
let zoomFactor = 0.05; // ズームの感度

mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

// **ページスクロールを無効化**
window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

// **マウスカーソルを基準にズーム**
window.addEventListener(
    "wheel",
    (e) => {
        e.preventDefault(); // デフォルトのスクロールを無効化

        let newScale = scale;

        if (e.deltaY < 0) {
            newScale = Math.min(scale + zoomFactor, 3); // 最大3倍まで
        } else {
            newScale = Math.max(scale - zoomFactor, 0.5); // 最小0.5倍まで
        }

        // **ズームの基準点をマウスカーソルの位置に変更**
        const mouseX = e.clientX; // マウスのX座標
        const mouseY = e.clientY; // マウスのY座標

        // **マップ上での相対位置を計算**
        const offsetX = (mouseX - translateX) * (newScale / scale - 1);
        const offsetY = (mouseY - translateY) * (newScale / scale - 1);

        translateX -= offsetX;
        translateY -= offsetY;
        scale = newScale;

        requestAnimationFrame(() => {
            mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        });
    },
    { passive: false } // **ここが重要！`passive: false` を明示的に指定**
);

// クリック＆ドラッグでマップを移動
mapContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    requestAnimationFrame(() => {
        mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    });
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});
