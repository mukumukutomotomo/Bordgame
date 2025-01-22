<?php
session_start();
echo "セッションのユーザーネーム: " . (isset($_SESSION["username"]) ? $_SESSION["username"] : "未設定");
?>
