const mapContainer = document.getElementById("map-container");
let scale = 1; // 初期ズーム
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let zoomFactor = 0.05; // ズームの感度

mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

// **ズーム（マウスホイールで拡大縮小）**
window.addEventListener(
    "wheel",
    (e) => {
        e.preventDefault();

        let newScale = scale;

        if (e.deltaY < 0) {
            newScale = Math.min(scale + zoomFactor, 3); // 最大3倍まで
        } else {
            newScale = Math.max(scale - zoomFactor, 0.5); // 最小0.5倍まで
        }

        // マップの中心を基準にズーム
        const rect = mapContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (centerX - translateX) * (newScale / scale - 1);
        const offsetY = (centerY - translateY) * (newScale / scale - 1);

        translateX -= offsetX;
        translateY -= offsetY;
        scale = newScale;

        requestAnimationFrame(() => {
            mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        });
    },
    { passive: false }
);

// **クリック＆ドラッグでマップ移動**
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
