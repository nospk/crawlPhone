document.getElementById("buttonRun").addEventListener("click", runCrawl);

const defaultApp = () => {
    document.getElementById("status").innerHTML = '';
    document.getElementById("shopNumber").innerHTML = '';
    document.getElementById("productNumber").innerHTML = '';
    document.getElementById("pageNumber").innerHTML = '';
}

function runCrawl() {
    let typeRun = document.getElementById("typeRun").value;
    let keyword = document.getElementById("keyword").value;
    let delayMin = document.getElementById("delayMin").value;
    let delayMax = document.getElementById("delayMax").value;
    let pageMax = document.getElementById("pageMax").value;
    window.api.send("runCrawl", { typeRun, keyword, delayMin, delayMax, pageMax });
}
window.api.receive("notification-error", (data) => {
    if (data) {
        let textarea = document.getElementById('logs');
        textarea.value += new Date().toLocaleTimeString() + ': ' + data + '\n';
    }
});