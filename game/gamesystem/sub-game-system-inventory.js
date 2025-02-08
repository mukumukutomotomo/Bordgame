document.getElementById("openinventory").addEventListener("click", function() {
    var inventory = document.getElementById("inventory");
    if (inventory.style.display === "none") {
        inventory.style.display = "block";
    } else {
        inventory.style.display = "none";
    }
});