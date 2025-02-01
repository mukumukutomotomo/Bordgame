document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("map-container");
    const board = document.getElementById("board");

    if (!mapContainer || !board) {
        console.error("❌ mapContainer または board が見つかりません");
        return;
    }

    let scale = 1; // 初期ズーム
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    let zoomFactor = 0.05; // ズームの感度

    // **ズーム処理（マップ＆ボードを拡大縮小）**
    window.addEventListener("wheel", (e) => {
        e.preventDefault();

        let newScale = scale;
        if (e.deltaY < 0) {
            newScale = Math.min(scale + zoomFactor, 3); // 最大3倍まで
        } else {
            newScale = Math.max(scale - zoomFactor, 1); // 最小1倍まで
        }

        // ズームの中心補正
        const rect = mapContainer.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = (centerX - rect.left - rect.width / 2) * (newScale / scale - 1);
        const offsetY = (centerY - rect.top - rect.height / 2) * (newScale / scale - 1);

        translateX -= offsetX;
        translateY -= offsetY;
        scale = newScale;

        updateTransform();
    }, { passive: false });

    // **ドラッグでマップ＆ボードを移動**
    mapContainer.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // **ウィンドウリサイズ時にマップとボードを調整**
    window.addEventListener("resize", updateTransform);

    // **マップとボードを画面内に収める**
    function updateTransform() {
        const mapWidth = mapContainer.offsetWidth * scale;
        const mapHeight = mapContainer.offsetHeight * scale;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

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

        // **マップの位置を適用**
        mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        // **ボードもマップと同じ `translate` を適用**
        board.style.transform = `perspective(800px) rotateX(45deg) scale(${scale})`;
    }
});
