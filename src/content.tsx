import ReactDOM from "react-dom";
import React from "react";
// 监控页面中的ETH交易哈希
const monitorTxHash = () => {
  // 此处假设交易哈希的正则表达式为/0x[a-fA-F0-9]{64}/
  const txHashRegex = /0x[a-fA-F0-9]{64}/g;
  const txHashElements = document.getElementsByTagName("*");

  // 遍历所有元素，查找包含交易哈希的文本节点
  for (const element of txHashElements) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const matches = text.match(txHashRegex);

        // 如果匹配到交易哈希，则为其创建链接
        if (matches) {
          matches.forEach((txHash) => {
            addLink(node as Text);
          });
        }
      }
    }
  }
};

// 在页面加载完成后开始监控交易哈希
window.addEventListener("load", monitorTxHash);

const createLink = (txHash: string): HTMLAnchorElement => {
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
            id="eigentx-link"
            target={"_blank"}
            href={`https://eigenphi.io/mev/eigentx/${txHash}`}
          >
            Open In EigenPhi.io
          </a>
        </div>
      </div>
      <div className="eigentx-openineigentx-wrap">
        <a target={"_blank"} href={`https://eigenphi.io/mev/eigentx/${txHash}`}>
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
        <div className="eigentx-loading-prompt" id="eigentx-loading">
          EigenTxChart Loading...
        </div>
      </div>
      <hr className="eigentx-dividing hr-space my-4" />
    </div>
  );

  const wrap = document.createElement("div");
  ReactDOM.hydrate(stage, wrap);
  const link = document.createElement("a");
  link.href = "javascript:void(0)";
  link.textContent = " Load Transfer Flow Chart";

  link.onclick = function () {
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
    if (document.URL.includes("bscscan.com")) {
      chain = "bsc";
    }

    if (!document.querySelector(".eigentx-stage")) {
      // console.log(2, txHash)

      const injectedDom =
        document.querySelectorAll("#ContentPlaceHolder1_maintable .card")[0] ||
        document.querySelectorAll("#myTabContent .tab-pane")[0];

      if (injectedDom) {
        const stage = document.createElement("div");
        stage.innerHTML = wrap.innerHTML;
        stage.firstElementChild.className = "eigentx-stage";
        injectedDom.appendChild(stage.firstElementChild);

        document.getElementById("eigentx-pic").onload = function () {
          document.getElementById("eigentx-loading").style.display = "none";
        };

        function addDesc(text, type) {
          const linkMap = {
            unknown: `https://eigenphi.io/mev/eigentx/${txHash}`,
            arbitrage: `https://eigenphi.io/mev/${chain}/tx/${txHash}`,
            sandwich: `https://eigenphi.io/mev/${chain}/tx/${txHash}`,
            liquidation: `https://eigenphi.io/mev/${chain}/liquidation/tx/${txHash}`,
          };
          document.getElementById("eigentx-desc").innerHTML = text;
          [].slice
            .call(document.getElementsByClassName("eigentx-link"))
            .forEach((el) => {
              el.setAttribute("href", linkMap[type.toLowerCase()]);
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
                      )}; via ${json.summary.tokenCount} tokens and ${
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
                      ([liquidatedTokenLabelResp, debtTokenLabelResp]) => {
                        Promise.all([
                          liquidatedTokenLabelResp.json(),
                          debtTokenLabelResp.json(),
                        ]).then(
                          ([liquidatedTokenLabelJson, debtTokenLabelJson]) => {
                            addDesc(
                              `Liquidation Transaction (&asymp;$${amount(
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
                              )}) `,
                              txType
                            );
                          }
                        );
                      }
                    );
                  } else if (txType === "PartialSandwich") {
                    const commonPool = json.tokenFlows.find(
                      (item) => item.tags && item.tags.includes("CommonTrader")
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

                        addDesc(
                          `Partial of Sandwich MEV (role: Attacker; profit: &asymp;$${amount(
                            sandwichVirtualTxJson.summary.profit,
                            2
                          )}; common-pool: ${lpName}) `,
                          "sandwich"
                        );
                      });
                    });
                  } else {
                    addDesc("Not included in EigenPhi database. ", "unknown");
                  }
                } else {
                  addDesc("Not included in EigenPhi database. ", "unknown");
                }
              }
            })
            .catch(() => {
              addDesc("Not included in EigenPhi database. ", "unknown");
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
  };

  link.style.marginLeft = "10px";

  const img = document.createElement("img");
  img.style.height = "18px";
  img.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjY0MjYxMjI2NjU0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjM0NzkiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiPjxwYXRoIGQ9Ik04NTguNDk3MTQ3IDc1MC41ODc3MDlhNDUuNDMxOTkzIDQ1LjQzMTk5MyAwIDEgMSA0NS40MzE5OTMtNDUuNDMxOTkzIDQ2LjcxMTc2NyA0Ni43MTE3NjcgMCAwIDEtMTMuNDM3NjMyIDMxLjk5NDM2MSA0Ny45OTE1NDEgNDcuOTkxNTQxIDAgMCAxLTMxLjk5NDM2MSAxMy40Mzc2MzJ6TTQ5NS4wNDEyMDYgOTU0LjcxMTczMmE0NS40MzE5OTMgNDUuNDMxOTkzIDAgMSAxIDQ1LjQzMTk5My00NS40MzE5OTMgNDUuNDMxOTkzIDQ1LjQzMTk5MyAwIDAgMS00NS40MzE5OTMgNDUuNDMxOTkzeiBtLTM0MS4wNTk4ODgtMjA0LjEyNDAyM2E0NS40MzE5OTMgNDUuNDMxOTkzIDAgMCAxIDAtOTAuODYzOTg1IDQ0Ljc5MjEwNSA0NC43OTIxMDUgMCAwIDEgNDUuNDMxOTkzIDQ1LjQzMTk5MiA0Ni4wNzE4OCA0Ni4wNzE4OCAwIDAgMS0xMi43OTc3NDUgMzEuOTk0MzYxIDQ3Ljk5MTU0MSA0Ny45OTE1NDEgMCAwIDEtMzIuNjM0MjQ4IDEzLjQzNzYzMnogbTcwMy44NzU5NDItMTU5LjMzMTkxOEExMTMuODk5OTI1IDExMy44OTk5MjUgMCAwIDAgNzQ0LjU5NzIyMiA3MjcuNTUxNzY5bC0xNzIuMTI5NjYyIDk4LjU0MjYzMmExMTEuOTgwMjYzIDExMS45ODAyNjMgMCAwIDAtMTUyLjI5MzE1OSAwTDI2NC42ODE4MDcgNzMxLjM5MTA5MmExMjIuODU4MzQ2IDEyMi44NTgzNDYgMCAwIDAgMC0yNi4yMzUzNzYgMTE0LjUzOTgxMiAxMTQuNTM5ODEyIDAgMCAwLTg1Ljc0NDg4OC0xMTEuOTgwMjYzIDExMy44OTk5MjUgMTEzLjg5OTkyNSAwIDAgMC0xMjcuOTc3NDQzIDYzLjk4ODcyMiAxMTIuNjIwMTUxIDExMi42MjAxNTEgMCAwIDAgMzUuODMzNjg0IDEzOC4yMTU2MzlBMTEzLjg5OTkyNSAxMTMuODk5OTI1IDAgMCAwIDIzMi42ODc0NDYgNzg5LjYyMDgyOWwxNTIuMjkzMTU4IDkzLjQyMzUzNGE4OS41ODQyMTEgODkuNTg0MjExIDAgMCAwLTMuODM5MzIzIDI2LjIzNTM3NiAxMTMuODk5OTI1IDExMy44OTk5MjUgMCAwIDAgMTgzLjY0NzYzMiA5MC44NjM5ODYgMTEzLjI2MDAzOCAxMTMuMjYwMDM4IDAgMCAwIDQwLjk1Mjc4Mi0xMTMuMjYwMDM4bDE3NS4zMjkwOTgtOTguNTQyNjMyYTExMy4yNjAwMzggMTEzLjI2MDAzOCAwIDEgMCA3Ny40MjYzNTQtMTk3LjA4NTI2NHogbS03MDMuODc1OTQyLTMxOS45NDM2MWE0NS40MzE5OTMgNDUuNDMxOTkzIDAgMSAxLTQ1LjQzMTk5MyA0OC42MzE0MjkgNDUuNDMxOTkzIDQ1LjQzMTk5MyAwIDAgMSA0NS40MzE5OTMtNDYuNzExNzY3eiBtMzYzLjQ1NTk0MS0yMDIuMjA0MzYxYTQ1LjQzMTk5MyA0NS40MzE5OTMgMCAxIDEtNDUuNDMxOTkzIDQ1LjQzMTk5MiA0NS40MzE5OTMgNDUuNDMxOTkzIDAgMCAxIDQ1LjQzMTk5My00NS40MzE5OTJ6IG0zNDEuMDU5ODg4IDIwNC4xMjQwMjNhNDUuNDMxOTkzIDQ1LjQzMTk5MyAwIDEgMS00NS40MzE5OTMgNDUuNDMxOTkyIDQ1LjQzMTk5MyA0NS40MzE5OTMgMCAwIDEgNDUuNDMxOTkzLTQ1LjQzMTk5MnogbS03MDMuODc1OTQyIDE1OS4zMzE5MThhMTEzLjg5OTkyNSAxMTMuODk5OTI1IDAgMCAwIDExMC43MDA0ODktMTM2LjI5NTk3OGwxNzQuNjg5MjExLTk4LjU0MjYzMmExMTEuOTgwMjYzIDExMS45ODAyNjMgMCAwIDAgMTUyLjI5MzE1OSAwbDE1NS40OTI1OTQgOTMuNDIzNTM0QTExNy4wOTkzNjEgMTE3LjA5OTM2MSAwIDAgMCA3NDQuNTk3MjIyIDMxOS45NDM2MWExMTMuMjYwMDM4IDExMy4yNjAwMzggMCAwIDAgMjE2LjkyMTc2NyA0Ny45OTE1NDEgMTEzLjI2MDAzOCAxMTMuMjYwMDM4IDAgMCAwLTE3Ny44ODg2NDctMTMyLjQ1NjY1NEw2MjcuNDk3ODYxIDE0MC43NzUxODhhODkuNTg0MjExIDg5LjU4NDIxMSAwIDAgMCAzLjgzOTMyMy0yNi4yMzUzNzYgMTEzLjI2MDAzOCAxMTMuMjYwMDM4IDAgMSAwLTIyNC42MDA0MTQgMjIuMzk2MDUzTDIzMi42ODc0NDYgMjM1LjQ3ODQ5N2ExMTMuMjYwMDM4IDExMy4yNjAwMzggMCAxIDAtNzguNzA2MTI4IDE5Ny4wODUyNjR6IG03OTUuMzc5ODE0IDQ1LjQzMTk5Mkg4Ni4xNTMyNzNhMzMuOTE0MDIzIDMzLjkxNDAyMyAwIDAgMCAwIDY3LjgyODA0Nkg5NDkuMzYxMTMyYTMzLjkxNDAyMyAzMy45MTQwMjMgMCAxIDAgMC02Ny44MjgwNDZ6IiBwLWlkPSIzNDgwIiBmaWxsPSIjN2U4Mjk5Ij48L3BhdGg+PC9zdmc+";

  link.insertBefore(img, link.firstChild);

  return link;
};

const addLink = (txHashNode: Text) => {
  const txHash = txHashNode.textContent!;
  const link = createLink(txHash);
  if (txHashNode.parentElement.parentElement.id === "referralLink-1") {
    txHashNode.parentElement.parentElement.nextElementSibling.after(link);
  } else {
    txHashNode.after(link);
  }
};
