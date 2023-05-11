import ReactDOM from "react-dom";
import React, { useEffect } from "react";
import { ChainIcon } from "./ChainIcon";

export function App() {
  useEffect(() => {
    chrome.tabs?.query?.({ active: true }, (tabs) => {
      const url = tabs[0].url;
      if (url) {
        const match = url.match(/tx\/(0x[0-9a-fA-F]+)/);
        if (match) {
          const txHash = match[1];
          (document.getElementById("txHash") as HTMLInputElement).value =
            txHash;
        }
      }
    });
  }, []);

  return (
    <div className="px-5 mx-5 my-4 bg-white rounded-lg shadow-md text-sm w-80">
      <div className="py-10 search-box">
        <div className="flex justify-center">
          <input
            className="border border-gray-300 rounded-md w-60 h-10 px-2 multi-tx-input"
            placeholder="Enter Tx Hash"
            id="txHash"
            autoFocus
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              const txHash = (
                document.getElementById("txHash") as HTMLInputElement
              ).value;
              if (txHash) {
                const url = `https://eigenphi.io/mev/eigentx/${txHash}`;
                chrome.tabs.create({ url });
                window.close();
              }
            }}
          >
            Search
          </button>
        </div>
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
          className="text-gray-400 text-xs mr-5"
          href="https://github.com/eigenphi/EigenTx-extension/blob/main/PrivacyPolicy.md"
          target="_blank"
        >
          Privacy Policy
        </a>
        <a
          className="text-gray-400 text-xs"
          href="https://github.com/eigenphi/EigenTx-extension"
          target="_blank"
        >
          About EigenTx
        </a>
      </div>
    </div>
  );
}
