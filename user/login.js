document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    form.addEventListener("submit", (event) => {
        const username = document.getElementById("username").value.trim();
        if (username === "") {
            alert("ユーザーネームを入力してください。");
            event.preventDefault();
        }
    });
});
