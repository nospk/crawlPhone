document.getElementById("buttonRun").addEventListener("click", runCrawl);
document.getElementById("buttonStop").addEventListener("click", stopCrawl);
document.getElementById("buttonOpenFolder").addEventListener("click", openFolder);
function openFolder() {
    window.api.send("openFolder", "");
}
function stopCrawl() {
    let typeRun = document.getElementById("typeRun").value;
    window.api.send("stopCrawl", { typeRun });
    document.getElementById("buttonStop").classList.add("d-none");
    document.getElementById("buttonRun").classList.remove("d-none");
    document.getElementById("typeRun").disabled = false;
}
function runCrawl() {
    let typeRun = document.getElementById("typeRun").value;
    let keyword = document.getElementById("keyword").value;
    let delayMin = document.getElementById("delayMin").value;
    let delayMax = document.getElementById("delayMax").value;
    let pageMax = document.getElementById("pageMax").value;
    window.api.send("runCrawl", { typeRun, keyword, delayMin, delayMax, pageMax });
    document.getElementById("buttonRun").classList.add("d-none");
    document.getElementById("buttonStop").classList.remove("d-none");
    document.getElementById("typeRun").disabled = true;
}
window.api.receive("notification-error", (data) => {
    if (data) {
        let textarea = document.getElementById('logs');
        textarea.value += new Date().toLocaleTimeString() + ': ' + data + '\n';
        document.getElementById("buttonStop").classList.add("d-none");
        document.getElementById("buttonRun").classList.remove("d-none");
        document.getElementById("typeRun").disabled = false;
    }
});
window.api.receive("notification-running", (data) => {
    if (data) {
        let textarea = document.getElementById('logs');
        textarea.value += new Date().toLocaleTimeString() + ': ' + data + '\n';
    }
});
window.api.receive("notification-status", (data) => {
    if (data) {
        document.getElementById('status').innerHTML = data.status;
        document.getElementById('shopNumber').innerHTML = data.shopNumber;
        document.getElementById('pageNumber').innerHTML = data.pageNumber;
        document.getElementById('productNumber').innerHTML = data.productNumber;
    }
    if (data.status == "Kết thúc") {
        document.getElementById("buttonStop").classList.add("d-none");
        document.getElementById("buttonRun").classList.remove("d-none");
        document.getElementById("typeRun").disabled = false;
    }
});