document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        if (username === "") {
            alert("ユーザーネームを入力してください。");
            return;
        }

        fetch("login.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ username: username })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("サーバーエラー: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("サーバーからのレスポンス:", data); // 🎯 ここで `data.token` の値を確認
        
            if (data.success) {
                console.log("リダイレクト開始:", data.redirect);
                console.log("✅ 保存するトークン:", data.token); // 🎯 `token` の値を確認
        
                if (!data.token) {
                    console.error("❌ token がサーバーから送られていません");
                } else {
                    sessionStorage.setItem("playerToken", data.token);
                }
        
                window.location.href = `${data.redirect}?token=${data.token}`;
            } else {
                alert(data.error);
            }
        });        
    });
});
