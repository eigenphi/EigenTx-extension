loadButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result = tabUrl.includes("https://etherscan.io/tx/", 0) || 
               tabUrl.includes("https://bscscan.com/tx/") ||
               tabUrl.includes("https://snowtrace.io/tx/") ||
               tabUrl.includes("https://polygonscan.com/tx/") ||
               tabUrl.includes("https://arbiscan.io/tx/") ||
               tabUrl.includes("https://optimistic.etherscan.io/tx/") ||
               tabUrl.includes("https://ftmscan.com/tx/") ||
               tabUrl.includes("https://cronoscan.com/tx/")
               ;

  if(result) {
    let txHash = (tabUrl+'').match(/(0x\w+)/)[0] ?? '';

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (txHash, tabUrl) => {
        var chain = 'ethereum';
        if(tabUrl.includes("bscscan.com")) {
          chain = 'bsc';
        }
        //console.log(tabUrl)

        if(!document.querySelector('.eigentx-stage')){
          // console.log(2, txHash)

          const injectedDom = document.querySelectorAll('.row.align-items-center.mb-4')[5] || document.querySelectorAll('.row.align-items-center.mn-3')[1];

          // console.log(3, injectedDom)

          if(injectedDom){

            const stage = document.createElement('div');
            // stage.classList.add('eigentx-stage')
            stage.classList.add('col-md-12')

            const img  = document.createElement("embed");
            img.src = "https://tx.eigenphi.io/analyseTransaction.svg?chain=ALL&tx="+txHash;
            img.className = 'eigentx-chart-pic'

            const dividing = document.createElement('hr');
            dividing.classList.add('eigentx-dividing');
            dividing.classList.add('hr-space');
            dividing.classList.add('my-4');

            const descriptionRow = document.createElement('div');
            descriptionRow.classList.add('row')
            descriptionRow.classList.add('col-md-12')


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
            stage.appendChild(descriptionRow);
            openInEigenTxWrap.appendChild(openInEigenTx);
            stage.appendChild(openInEigenTxWrap);
            stage.appendChild(chartWrap)
            stage.appendChild(dividing2);
            injectedDom.appendChild(stage);

            var x = new XMLHttpRequest();
            x.open('GET', 'https://eigenphi.io/api/v1/dataservice/search/?chain='+chain+'&q=' + txHash);
            x.onload = function() {
              // console.log(4, x.responseText)
              const respObj = JSON.parse(x.responseText)
              // console.log(5, respObj)

              const descriptionRowTitle = document.createElement('div');
              descriptionRowTitle.classList.add('col-md-3')
              descriptionRowTitle.classList.add('font-weight-bold')
              descriptionRowTitle.classList.add('font-weight-md-normal')
              descriptionRowTitle.classList.add('mb-1')
              descriptionRowTitle.classList.add('mb-md-0')
              descriptionRowTitle.innerText = 'Transaction Description: '
              
              const descriptionRowValue = document.createElement('div');
              descriptionRowValue.classList.add('col-md-9')

              const descriptionRowLink = document.createElement('a');
              descriptionRowLink.innerText = 'Open In EigenPhi.io'
              descriptionRowLink.target = "_blank";
              descriptionRowLink.href = "https://eigenphi.io/"+chain+"/tx/" + txHash

              if(respObj['result'] != undefined &&
                 respObj['result']['data'] != undefined &&
                 respObj['result']['data'][0] != undefined &&
                 respObj['result']['data'][0]['transaction'] != undefined &&
                 respObj['result']['data'][0]['transaction']['type'] != undefined
                ) {
                // console.log(6, respObj['result']);
                var text = '';

                var y = new XMLHttpRequest();
                y.open('GET', 'https://eigenphi.io/api/v1/arbitrage/stat/txProfit/?chain='+chain+'&tx_hash=' + txHash);
                y.onload = function() {
                  
                  // console.log(10, y.responseText)
                  const profitObj = JSON.parse(y.responseText)

                  
                  if(respObj['result']['data'][0]['transaction']['type'] == 'Sandwich') {

                    var z = new XMLHttpRequest();
                    z.open('GET', 'https://eigenphi.io/api/v1/dataservice/arbitrage_transaction_flow/?chain='+chain+'&tx_hash=' + txHash);
                    z.onload = function() {

                      const sandwichObj = JSON.parse(z.responseText)

                      text += 'Partial of Sandwich MEV (role: ';
                     
                      if(respObj['result']['data'][0]['type'][1] == 'SandwichAttacker') {
                        text += 'Attacker';
                        text += '; profit: &asymp;$';
                      } else if(respObj['result']['data'][0]['type'][1] == 'SandwichVictim') {
                        text += 'Victim';
                        text += '; loss: &asymp;$';
                      }

                      const commonLP = sandwichObj['result']['attackedLPs'];

                      text += profitObj['result']['data']['profit'].toFixed(2);
                      text += '; common-pool: ';
                      text += sandwichObj['result']['lpToTokens'][commonLP][0]['symbol'];
                      text += '-';
                      text += sandwichObj['result']['lpToTokens'][commonLP][1]['symbol'];
                      text += '@';
                      text += sandwichObj['result']['addressToLabels'][commonLP];
                      text += ') ';

                      descriptionRowValue.innerHTML = text;
                      descriptionRowValue.appendChild(descriptionRowLink);
                      descriptionRow.appendChild(descriptionRowTitle);
                      descriptionRow.appendChild(descriptionRowValue);
                    };
                    z.send();

                  } else if(respObj['result']['data'][0]['transaction']['type'] == 'Spatial' || 
                    respObj['result']['data'][0]['transaction']['type'] == 'Triangular' || 
                    respObj['result']['data'][0]['transaction']['type'] == 'Combination') {

                    text += 'Arbitrage Transaction (profit: &asymp;$';
                    text += profitObj['result']['data']['profit'].toFixed(2);
                    text += '; via ';
                    text += profitObj['result']['data']['tokenCount'];
                    text += ' tokens and ';
                    text += profitObj['result']['data']['lpCount'];
                    text += ' venues)  ';
                    // console.log(12, text);
                    descriptionRowValue.innerHTML = text;
                    descriptionRowValue.appendChild(descriptionRowLink);
                    descriptionRow.appendChild(descriptionRowTitle);
                    descriptionRow.appendChild(descriptionRowValue);

                  } else if(respObj['result']['data'][0]['transaction']['type'] == 'Liquidation') {

                    
                    // console.log(12, text);
                    var z = new XMLHttpRequest();
                    z.open('GET', 'https://eigenphi.io/api/v1/dataservice/tx/liquidations/?chain='+chain+'&tx_hash=' + txHash);
                    z.onload = function() {

                      const liquidationObj = JSON.parse(z.responseText)

                      text += 'Liquidation Transaction (&asymp;$';
                      text += liquidationObj['result']['details'][0]['liquidationAmount'].toFixed(2) + ' ';
                      text += liquidationObj['result']['details'][0]['liquidatedAsset']['symbol'];
                      text += ' Liquidated, and &asymp;$'
                      text += liquidationObj['result']['details'][0]['debtToCover'].toFixed(2) + ' ';
                      text += liquidationObj['result']['details'][0]['debtAsset']['symbol'];
                      text += ' repaid at '
                      text += liquidationObj['result']['details'][0]['protocol']['showName'];
                      text += '; profit: &asymp;$';
                      text += profitObj['result']['data']['profit'].toFixed(2);
                      text += ')  ';


                      descriptionRowLink.href = "https://eigenphi.io/ethereum/liquidation/tx/" + txHash;

                      descriptionRowValue.innerHTML = text;
                      descriptionRowValue.appendChild(descriptionRowLink);
                      descriptionRow.appendChild(descriptionRowTitle);
                      descriptionRow.appendChild(descriptionRowValue);
                    };
                    z.send();

                  } else {
                    text = 'Not included in EigenPhi database';
                    descriptionRowValue.innerHTML = text;
                    descriptionRowValue.appendChild(descriptionRowLink);
                    descriptionRow.appendChild(descriptionRowTitle);
                    descriptionRow.appendChild(descriptionRowValue);
                  }

                };
                y.send();



              } else {
                text = 'Not included in EigenPhi database';
                // console.log(7, "undefined");
                  
                descriptionRowValue.innerHTML = text;
                descriptionRow.appendChild(descriptionRowTitle);
                descriptionRow.appendChild(descriptionRowValue);

              }
              

            };
            x.send();

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
      args: [txHash, tabUrl],
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
  let result = tabUrl.includes("https://etherscan.io/tx/", 0) || 
               tabUrl.includes("https://bscscan.com/tx/") ||
               tabUrl.includes("https://snowtrace.io/tx/") ||
               tabUrl.includes("https://polygonscan.com/tx/") ||
               tabUrl.includes("https://arbiscan.io/tx/") ||
               tabUrl.includes("https://optimistic.etherscan.io/tx/") ||
               tabUrl.includes("https://cronoscan.com/tx/") ||
               tabUrl.includes("https://ftmscan.com/tx/") ||
               tabUrl.includes("https://cronoscan.com/tx/")
               ;
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
