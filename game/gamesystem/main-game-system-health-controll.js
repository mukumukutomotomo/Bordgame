// ハートアイコンの更新関数
function updateHearts(hp) {
    let hpContainer = document.getElementById("hp-container");
    hpContainer.innerHTML = ""; // 一旦クリア

    for (let i = 0; i < hp; i++) {
        let heart = document.createElement("span");
        heart.innerHTML = "❤️"; // ハートアイコン
        heart.style.fontSize = "24px"; // アイコンの大きさ
        heart.style.marginRight = "5px";
        hpContainer.appendChild(heart);
    }
}

// 初期HPを取得してハートを生成
fetch("session.php")
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            updateHearts(data.hp);
        }
    })
    .catch(error => console.error("Error fetching HP:", error));
