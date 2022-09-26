// When the button is clicked, inject setPageBackgroundColor into current page
loadButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result = tabUrl.includes("https://etherscan.io/tx/", 0);
  if(result) {
    let txHash = tabUrl.substring(24, 90);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: setPageBackgroundColor,
      args: [txHash],
    });
    console.log(tab.id); 
  }
});

runButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result = tabUrl.includes("https://etherscan.io/tx/", 0);
  if(result) {
    let txHash = tabUrl.substring(24, 90);
    var uri = "https://tx.eigenphi.io/analyseTransaction?chain=ethereum&tx="+txHash;
    chrome.tabs.create({ url: uri });
  }
});

function setPageBackgroundColor(txHash) {
  console.log(txHash); 
  var _dom = document.getElementsByClassName('row align-items-center mb-4');
  console.log(_dom); 

  var img  = document.createElement("img");
  img.src = "https://tx.eigenphi.io/analyseTransaction.svg?chain=ethereum&tx="+txHash;
  img.height = "400";
  img.width = "1000";
  
  _dom[5].appendChild(img);

}