loadButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result =
    tabUrl.includes("https://etherscan.io/tx/", 0) ||
    tabUrl.includes("https://bscscan.com/tx/") ||
    tabUrl.includes("https://snowtrace.io/tx/") ||
    tabUrl.includes("https://polygonscan.com/tx/") ||
    tabUrl.includes("https://arbiscan.io/tx/") ||
    tabUrl.includes("https://optimistic.etherscan.io/tx/") ||
    tabUrl.includes("https://ftmscan.com/tx/") ||
    tabUrl.includes("https://cronoscan.com/tx/");
  if (result) {
    let txHash = (tabUrl + "").match(/(0x\w+)/)[0] ?? "";

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (txHash, tabUrl) => {
        function amount(val, digits = 6) {
          const value = typeof val === "string" ? parseFloat(val) : val;
          return value || value === 0
            ? value.toLocaleString("zh-CN", {
                minimumFractionDigits: digits ?? 2,
                maximumFractionDigits: digits ?? 2,
              })
            : null;
        }
        var chain = "ethereum";
        if (tabUrl.includes("bscscan.com")) {
          chain = "bsc";
        }
        //console.log(tabUrl)

        if (!document.querySelector(".eigentx-stage")) {
          // console.log(2, txHash)

          const injectedDom =
            document.querySelectorAll(".row.align-items-center.mb-4")[5] ||
            document.querySelectorAll(".row.align-items-center.mn-3")[1];

          // console.log(3, injectedDom)

          if (injectedDom) {
            const stage = document.createElement("div");
            // stage.classList.add('eigentx-stage')
            stage.classList.add("col-md-12");

            const img = document.createElement("embed");
            img.src =
              "https://tx.eigenphi.io/analyseTransaction.svg?chain=ALL&tx=" +
              txHash;
            img.className = "eigentx-chart-pic";

            const dividing = document.createElement("hr");
            dividing.classList.add("eigentx-dividing");
            dividing.classList.add("hr-space");
            dividing.classList.add("my-4");

            const descriptionRow = document.createElement("div");
            descriptionRow.classList.add("row");
            descriptionRow.classList.add("col-md-12");

            const dividing2 = document.createElement("hr");
            dividing2.classList.add("eigentx-dividing");
            dividing2.classList.add("hr-space");
            dividing2.classList.add("my-4");

            const openInEigenTx = document.createElement("a");
            openInEigenTx.innerText = "Open In EigenTx";
            openInEigenTx.target = "_blank";
            openInEigenTx.href =
              "https://tx.eigenphi.io/analyseTransaction?chain=ALL&tx=" +
              txHash;

            const openInEigenTxWrap = document.createElement("div");
            openInEigenTxWrap.classList.add("eigentx-openineigentx-wrap");

            const chartWrap = document.createElement("div");

            const loading = document.createElement("div");
            chartWrap.appendChild(img);
            loading.innerHTML = "EigenTxChart Loading...";
            loading.className = "eigentx-loading-prompt";

            chartWrap.appendChild(loading);

            img.onload = function () {
              loading.innerHTML = "";
            };
            chartWrap.appendChild(img);

            stage.appendChild(dividing);
            stage.appendChild(descriptionRow);
            openInEigenTxWrap.appendChild(openInEigenTx);
            stage.appendChild(openInEigenTxWrap);
            stage.appendChild(chartWrap);
            stage.appendChild(dividing2);
            injectedDom.appendChild(stage);

            function addDesc(text, txType) {
              const descriptionRowTitle = document.createElement("div");
              descriptionRowTitle.classList.add("col-md-3");
              descriptionRowTitle.classList.add("font-weight-bold");
              descriptionRowTitle.classList.add("font-weight-md-normal");
              descriptionRowTitle.classList.add("mb-1");
              descriptionRowTitle.classList.add("mb-md-0");
              descriptionRowTitle.innerText = "Transaction Description: ";

              const descriptionRowValue = document.createElement("div");
              descriptionRowValue.classList.add("col-md-9");

              const descriptionRowLink = document.createElement("a");
              descriptionRowLink.innerText = "Open In EigenPhi.io";
              descriptionRowLink.target = "_blank";
              descriptionRowLink.href =
                "https://eigenphi.io/mev/" +
                chain +
                (txType === "Liquidation" ? "/liquidation" : "") +
                "/tx/" +
                txHash;
              descriptionRowValue.innerHTML = text;
              descriptionRowValue.appendChild(descriptionRowLink);
              descriptionRow.appendChild(descriptionRowTitle);
              descriptionRow.appendChild(descriptionRowValue);
            }

            fetch(
              `https://storage.googleapis.com/eigenphi-${chain}-tx/${txHash}`
            ).then((resp) => {
              resp.json().then((json) => {
                if (json && json.version === "v1.0.0") {
                } else {
                  if (json.summary) {
                    const txType = json.summary.types[0];
                    let epDesc = "Not included in EigenPhi database";
                    if (txType === "Arbitrage") {
                      epDesc = `Arbitrage Transaction (profit: &asymp;$${amount(
                        json.summary.profit,
                        2
                      )}; via ${json.summary.tokenCount} tokens and ${
                        json.summary.venueCount
                      } venues) Open In EigenPhi.io`;

                      addDesc(epDesc, txType);
                    } else if (txType === "Liquidation") {
                      Promise.all([
                        fetch(`
                          https://us-west1-arbitragescan.cloudfunctions.net/dbview?path=/alpha/${chain}/labels/${json.summary.liquidationDetails[0].liquidatedAsset.tokenAddress}
                        `),
                        fetch(`
                          https://us-west1-arbitragescan.cloudfunctions.net/dbview?path=/alpha/${chain}/labels/${json.summary.liquidationDetails[0].debtAsset.tokenAddress}
                        `),
                      ]).then(
                        ([liquidatedTokenLabelResp, debtTokenLabelResp]) => {
                          Promise.all([
                            liquidatedTokenLabelResp.json(),
                            debtTokenLabelResp.json(),
                          ]).then(
                            ([
                              liquidatedTokenLabelJson,
                              debtTokenLabelJson,
                            ]) => {
                              epDesc = `Liquidation Transaction (&asymp;$${amount(
                                json.summary.liquidationDetails[0]
                                  .liquidatedAsset.tokenVolume,
                                2
                              )} ${
                                liquidatedTokenLabelJson.token.symbol
                              } Liquidated, and &asymp;$${amount(
                                json.summary.liquidationDetails[0].debtAsset
                                  .tokenVolume,
                                2
                              )} ${debtTokenLabelJson.token.symbol} repaid at ${
                                json.summary.liquidationDetails[0].protocol.name
                              }${
                                json.summary.liquidationDetails[0].protocol
                                  .protocolVersion
                              }; profit: &asymp;$${amount(
                                json.summary.profit,
                                2
                              )}) Open In EigenPhi.io`;
                              addDesc(epDesc, txType);
                            }
                          );
                        }
                      );
                    }

                    if (txType === "PartialSandwich") {
                      const commonPool = json.tokenFlows.find(
                        (item) =>
                          item.tags && item.tags.includes("CommonTrader")
                      );
                      Promise.all([
                        fetch(
                          `https://storage.googleapis.com/eigenphi-${chain}-tx/${json.resultId}`
                        ),
                        fetch(
                          `https://us-west1-arbitragescan.cloudfunctions.net/dbview?path=/alpha/${chain}/labels/${commonPool.address}`,
                          {
                            method: "GET",
                            mode: "cors",
                          }
                        ),
                      ]).then(([sandwichVirtualTxResp, commonLpLabelResp]) => {
                        Promise.all([
                          sandwichVirtualTxResp.json(),
                          commonLpLabelResp.json(),
                        ]).then(([sandwichVirtualTxJson, labelJson]) => {
                          const lpName =
                            (labelJson && labelJson.lp && labelJson.lp.name) ||
                            "unknown";

                          epDesc = `Partial of Sandwich MEV (role: Attacker; profit: &asymp;$${amount(
                            sandwichVirtualTxJson.summary.profit,
                            2
                          )}; common-pool: ${lpName}) Open In EigenPhi.io`;

                          addDesc(epDesc, txType);
                        });
                      });
                    }
                  }
                }
              });
            });

            const eigenTxStyle = document.createElement("style");

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
            `;

            stage.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            document.head.appendChild(eigenTxStyle);
          }
        }
      },
      args: [txHash, tabUrl],
    });
    console.log(tab.id);
  } else {
    alert(`Load transfer flow chart only works in transaction page of blockchain explorers.

    Go to pages like: https://etherscan.io/tx/0xa8df8a486213e6e7cfb6ade916d4753a2fb1731f78ff5d204246d316623e0711`);
  }
});

runButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var tabUrl = tab.url;
  let result =
    tabUrl.includes("https://etherscan.io/tx/", 0) ||
    tabUrl.includes("https://bscscan.com/tx/") ||
    tabUrl.includes("https://snowtrace.io/tx/") ||
    tabUrl.includes("https://polygonscan.com/tx/") ||
    tabUrl.includes("https://arbiscan.io/tx/") ||
    tabUrl.includes("https://optimistic.etherscan.io/tx/") ||
    tabUrl.includes("https://cronoscan.com/tx/") ||
    tabUrl.includes("https://ftmscan.com/tx/") ||
    tabUrl.includes("https://cronoscan.com/tx/");
  if (result) {
    let txHash = (tabUrl + "").match(/(0x\w+)/)[0] ?? "";
    var uri =
      "https://tx.eigenphi.io/analyseTransaction?chain=ALL&tx=" + txHash;
    chrome.tabs.create({ url: uri });
  } else {
    chrome.tabs.create({ url: "https://tx.eigenphi.io/analyseTransaction" });
  }
});

aboutButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://github.com/eigenphi/EigenTx-extension" });
});

privacyButton.addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://github.com/eigenphi/EigenTx-extension/blob/main/PrivacyPolicy.md",
  });
});
