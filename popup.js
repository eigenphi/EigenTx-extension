
loadButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result = tabUrl.includes("https://etherscan.io/tx/", 0) || tabUrl.includes("https://bscscan.com/tx/");
  if(result) {
    let txHash = (tabUrl+'').match(/(0x\w+)/)[0] ?? '';
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (txHash) => {
        console.log(1)
        if(!document.querySelector('.eigentx-stage')){
          console.log(2, txHash)

          const injectedDom = document.querySelectorAll('.row.align-items-center.mb-4')[5] || document.querySelectorAll('.row.align-items-center.mn-3')[1];

          console.log(3, injectedDom)

          if(injectedDom){

            const stage = document.createElement('div');
            stage.classList.add('eigentx-stage')
            stage.classList.add('col-md-12')

            const img  = document.createElement("embed");
            img.src = "https://tx.eigenphi.io/analyseTransaction.svg?chain=ALL&tx="+txHash;
            img.className = 'eigentx-chart-pic'

            const dividing = document.createElement('hr');
            dividing.classList.add('eigentx-dividing');
            dividing.classList.add('hr-space');
            dividing.classList.add('my-4');

            const dividing2 = document.createElement('hr');
            dividing2.classList.add('eigentx-dividing');
            dividing2.classList.add('hr-space');
            dividing2.classList.add('my-4');

            const openInEigenTx = document.createElement('a');
            openInEigenTx.innerText = 'Open In EigenTx'
            openInEigenTx.target = "_blank";
            openInEigenTx.href = "https://tx.eigenphi.io/analyseTransaction?chain=ALL&tx=" + txHash


            const openInEigenTxWrap = document.createElement('div');
            openInEigenTxWrap.classList.add('eigentx-openineigentx-wrap')


            const chartWrap = document.createElement('div');

            const loading = document.createElement('div');
            chartWrap.appendChild(img)
            loading.innerHTML = 'EigenTxChart Loading...';
            loading.className = 'eigentx-loading-prompt'

            chartWrap.appendChild(loading)

            img.onload = function(){
              loading.innerHTML = ''
            }
            chartWrap.appendChild(img);

            stage.appendChild(dividing);
            openInEigenTxWrap.appendChild(openInEigenTx);
            stage.appendChild(openInEigenTxWrap);
            stage.appendChild(chartWrap)
            stage.appendChild(dividing2);
            injectedDom.appendChild(stage);

            const eigenTxStyle = document.createElement('style')

            eigenTxStyle.innerHTML = `
              .eigentx-stage {
                text-align:right;
              }
              .eigentx-openineigentx-wrap {
                padding: 20px 10px;
                text-align: right;
              }
              .eigentx-chart-pic {
                width: 1342px;
              }
              .eigentx-loading-prompt {
                text-align: center;
              }
            `

            stage.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
            document.head.appendChild(eigenTxStyle)

          }
        }

      },
      args: [txHash],
    });
    console.log(tab.id); 
  }else{
    alert(`Load transfer flow chart only works in transaction page of blockchain explorers.

    Go to pages like: https://etherscan.io/tx/0xa8df8a486213e6e7cfb6ade916d4753a2fb1731f78ff5d204246d316623e0711`)
  }
});

runButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result = tabUrl.includes("https://etherscan.io/tx/", 0) || tabUrl.includes("https://bscscan.com/tx/");
  if(result) {
    let txHash = (tabUrl+'').match(/(0x\w+)/)[0] ?? '';
    var uri = "https://tx.eigenphi.io/analyseTransaction?chain=ALL&tx="+txHash;
    chrome.tabs.create({ url: uri });
  }else{
    chrome.tabs.create({url: 'https://tx.eigenphi.io/analyseTransaction'});
  }
});

aboutButton.addEventListener('click', () => {
  chrome.tabs.create({url: 'https://github.com/eigenphi/EigenTx-extension'});
} )

privacyButton.addEventListener('click', () => {
  chrome.tabs.create({url: 'https://github.com/eigenphi/EigenTx-extension/blob/main/PrivacyPolicy.md'});
})
