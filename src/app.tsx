import ReactDOM from "react-dom";
import React from "react";
import { parseTx } from "./utils";
import { Button } from "./button";
import { ChainIcon } from "./ChainIcon";

export function App() {
  return (
    <div className="px-5 mx-5 my-4 bg-white rounded-lg shadow-md text-sm w-80">
      <div className="flex flex-col gap-3 py-5">
        <Button
          icon={"images/flowchart.svg"}
          iconhover="images/flowchart-hover.svg"
          onClick={async () => {
            const [tab] = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });
            const txHash = parseTx(tab.url + "");
            if (txHash) {
              const stage = (
                <div className="col-md-12">
                  <hr className="eigentx-dividing hr-space my-4" />
                  <div className="row col-md-12">
                    <div className="col-md-3 font-weight-bold font-weight-md-normal mb-1 mb-md-0">
                      Transaction Description:
                    </div>
                    <div className="col-md-9">
                      <span id="eigentx-desc"></span>
                      <a
                        className="eigenphi-link"
                        target={"_blank"}
                        href={`https://eigenphi.io/mev/eigentx/${txHash}`}
                      >
                        Open In EigenPhi.io
                      </a>
                    </div>
                  </div>
                  <div className="eigentx-link eigentx-openineigentx-wrap">
                    <a
                      target={"_blank"}
                      href={`https://eigenphi.io/mev/eigentx/${txHash}`}
                    >
                      Open In EigenTx
                    </a>
                  </div>

                  <div>
                    <embed
                      src={
                        "https://tx.eigenphi.io/analyseTransaction.svg?chain=ALL&tx=" +
                        txHash
                      }
                      id="eigentx-pic"
                      className="eigentx-chart-pic"
                    />
                    <div
                      className="eigentx-loading-prompt"
                      id="eigentx-loading"
                    >
                      EigenTxChart Loading...
                    </div>
                  </div>
                  <hr className="eigentx-dividing hr-space my-4" />
                </div>
              );

              const wrap = document.createElement("div");
              ReactDOM.hydrate(stage, wrap);

              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (txHash, tabUrl, htmls) => {
                  function amount(val, digits = 6) {
                    const value =
                      typeof val === "string" ? parseFloat(val) : val;
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
                      document.querySelectorAll(
                        "#ContentPlaceHolder1_maintable .card"
                      )[0] ||
                      document.querySelectorAll("#myTabContent .tab-pane")[0];

                    if (injectedDom) {
                      const stage = document.createElement("div");
                      stage.innerHTML = htmls;
                      stage.firstElementChild.className = "eigentx-stage";
                      injectedDom.appendChild(stage.firstElementChild);

                      document.getElementById("eigentx-pic").onload =
                        function () {
                          document.getElementById(
                            "eigentx-loading"
                          ).style.display = "none";
                        };

                      function addDesc(text, type) {
                        const linkMap = {
                          unknown: `https://eigenphi.io/mev/eigentx/${txHash}`,
                          arbitrage: `https://eigenphi.io/mev/${chain}/tx/${txHash}`,
                          sandwich: `https://eigenphi.io/mev/${chain}/tx/${txHash}`,
                          liquidation: `https://eigenphi.io/mev/${chain}/liquidation/tx/${txHash}`,
                        };
                        document.getElementById("eigentx-desc").innerHTML =
                          text;

                        [].slice
                          .call(
                            document.getElementsByClassName("eigenphi-link")
                          )
                          .forEach((el) => {
                            el.setAttribute(
                              "href",
                              linkMap[type.toLowerCase()]
                            );
                          });
                      }

                      fetch(
                        `https://storage.googleapis.com/eigenphi-${chain}-tx/${txHash}`
                      ).then((resp) => {
                        resp
                          .json()
                          .then((json) => {
                            if (json && json.version === "v1.0.0") {
                            } else {
                              if (json.summary) {
                                const txType = json.summary.types[0];
                                if (txType === "Arbitrage") {
                                  addDesc(
                                    `Arbitrage Transaction (profit: &asymp;$${amount(
                                      json.summary.profit,
                                      2
                                    )}; via ${
                                      json.summary.tokenCount
                                    } tokens and ${
                                      json.summary.venueCount
                                    } venues) `,
                                    txType
                                  );
                                } else if (txType === "Liquidation") {
                                  Promise.all([
                                    fetch(`
                          https://us-west1-arbitragescan.cloudfunctions.net/dbview?path=/alpha/${chain}/labels/${json.summary.liquidationDetails[0].liquidatedAsset.tokenAddress}
                        `),
                                    fetch(`
                          https://us-west1-arbitragescan.cloudfunctions.net/dbview?path=/alpha/${chain}/labels/${json.summary.liquidationDetails[0].debtAsset.tokenAddress}
                        `),
                                  ]).then(
                                    ([
                                      liquidatedTokenLabelResp,
                                      debtTokenLabelResp,
                                    ]) => {
                                      Promise.all([
                                        liquidatedTokenLabelResp.json(),
                                        debtTokenLabelResp.json(),
                                      ]).then(
                                        ([
                                          liquidatedTokenLabelJson,
                                          debtTokenLabelJson,
                                        ]) => {
                                          addDesc(
                                            `Liquidation Transaction (&asymp;$${amount(
                                              json.summary.liquidationDetails[0]
                                                .liquidatedAsset.tokenVolume,
                                              2
                                            )} ${
                                              liquidatedTokenLabelJson.token
                                                .symbol
                                            } Liquidated, and &asymp;$${amount(
                                              json.summary.liquidationDetails[0]
                                                .debtAsset.tokenVolume,
                                              2
                                            )} ${
                                              debtTokenLabelJson.token.symbol
                                            } repaid at ${
                                              json.summary.liquidationDetails[0]
                                                .protocol.name
                                            }${
                                              json.summary.liquidationDetails[0]
                                                .protocol.protocolVersion
                                            }; profit: &asymp;$${amount(
                                              json.summary.profit,
                                              2
                                            )}) `,
                                            txType
                                          );
                                        }
                                      );
                                    }
                                  );
                                } else if (txType === "PartialSandwich") {
                                  const commonPool = json.tokenFlows.find(
                                    (item) =>
                                      item.tags &&
                                      item.tags.includes("CommonTrader")
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
                                  ]).then(
                                    ([
                                      sandwichVirtualTxResp,
                                      commonLpLabelResp,
                                    ]) => {
                                      Promise.all([
                                        sandwichVirtualTxResp.json(),
                                        commonLpLabelResp.json(),
                                      ]).then(
                                        ([
                                          sandwichVirtualTxJson,
                                          labelJson,
                                        ]) => {
                                          const lpName =
                                            (labelJson &&
                                              labelJson.lp &&
                                              labelJson.lp.name) ||
                                            "unknown";

                                          addDesc(
                                            `Partial of Sandwich MEV (role: Attacker; profit: &asymp;$${amount(
                                              sandwichVirtualTxJson.summary
                                                .profit,
                                              2
                                            )}; common-pool: ${lpName}) `,
                                            "sandwich"
                                          );
                                        }
                                      );
                                    }
                                  );
                                } else {
                                  addDesc(
                                    "Not included in EigenPhi database. ",
                                    "unknown"
                                  );
                                }
                              } else {
                                addDesc(
                                  "Not included in EigenPhi database. ",
                                  "unknown"
                                );
                              }
                            }
                          })
                          .catch(() => {
                            addDesc(
                              "Not included in EigenPhi database. ",
                              "unknown"
                            );
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
                width: 100%;
              }
              .eigentx-loading-prompt {
                text-align: center;
              }
            `;

                      injectedDom.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      document.head.appendChild(eigenTxStyle);
                    }
                  } else {
                    document.querySelector(".eigentx-stage")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                },
                args: [txHash, tab.url + "", wrap.innerHTML],
              });
              console.log(tab.id);
            } else {
              alert(`Load transfer flow chart only works in transaction page of blockchain explorers.

    Go to pages like: https://etherscan.io/tx/0xa8df8a486213e6e7cfb6ade916d4753a2fb1731f78ff5d204246d316623e0711`);
            }
          }}
        >
          Load Transfer Flow Chart
        </Button>
        <Button
          icon={"images/analysis.svg"}
          iconhover="images/analysis-hover.svg"
          onClick={async () => {
            const [tab] = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });
            const txHash = parseTx(tab.url + "");
            if (txHash) {
              var uri = `https://eigenphi.io/mev/eigentx/${txHash}`;
              chrome.tabs.create({ url: uri });
            } else {
              chrome.tabs.create({
                url: "https://eigenphi.io/mev/eigentx/",
              });
            }
          }}
        >
          Open In EigenTx
        </Button>
        <Button
          icon={"images/about.svg"}
          iconhover="images/about-hover.svg"
          onClick={() => {
            chrome.tabs.create({
              url: "https://github.com/eigenphi/EigenTx-extension",
            });
          }}
        >
          About EigenTx Extension (Ver1.5)
        </Button>
      </div>
      <div className="flex py-5 justify-center gap-1 border-t border-t-slate-300 border-dashed">
        <ChainIcon
          icon="images/chain-logo/ethereum.svg"
          title="Etherscan"
          href="https://etherscan.io"
        />
        <ChainIcon
          icon="images/chain-logo/BSC.svg"
          title="BscScan"
          href="https://bscscan.com"
        />
        <ChainIcon
          icon="images/chain-logo/AVASCAN.svg"
          title="SnowTrace"
          href="https://snowtrace.io"
        />
        <ChainIcon
          icon="images/chain-logo/polygonscan.svg"
          title="PolygonScan"
          href="https://polygonscan.com"
        />
        <ChainIcon
          icon="images/chain-logo/ARBISCAN.svg"
          title="ArbiScan"
          href="https://arbiscan.io"
        />
        <ChainIcon
          icon="images/chain-logo/Optimism.svg"
          title="Optimism"
          href="https://optimistic.etherscan.io"
        />
        <ChainIcon
          icon="images/chain-logo/cronoscan.svg"
          title="CronoScan"
          href="https://cronoscan.com"
        />
        <ChainIcon
          icon="images/chain-logo/Fantom.svg"
          title="FTMScan"
          href="https://ftmscan.com"
        />
      </div>
      <div className="flex justify-center p-5 pt-0">
        <a
          className="text-gray-400 text-xs"
          href="https://github.com/eigenphi/EigenTx-extension/blob/main/PrivacyPolicy.md"
          target="_blank"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
