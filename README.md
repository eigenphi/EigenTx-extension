# EigenTx extension - Add EigenTx transfer flow chart to your Etherscan transaction page

## Current verion 1.5
Install from chrome Store: https://chrome.google.com/webstore/detail/eigentx/gmjkhhheaknfaekapfiedhohdilpmgci

## Version change log

### version 1.5
26/10/2022
EigenTx extension version 1.5 released! 
- Add transaction description 
  - Arbitrage
  - Sandwich
  - Liquidation
- Fix bugs

### version 1.4
22/09/2022
EigenTx extension version 1.4 released! 
- Add support of Chains
  - Ethereum (https://etherscan.io)
  - BSC (https://bscscan.com)
  - Avalanche (C chain, https://snowtrace.io)
  - Polygon (https://polygonscan.com)
  - Arbitrum (https://arbiscan.io)
  - Optimism (https://optimistic.etherscan.io)
  - Fantom (https://ftmscan.com)
  - Cronos (https://cronoscan.com)
- Relayout user interface
- Fix bugs

## Readme

EigenTx is a public-facing on-chain transaction visualization tool on various blockchains.  EigenTx aims to help you quickly understand the transfer flow details of any on-chain transactions. 

In version 1.5, the extension loads the description of the current transaction from the EigenPhi database. More information could help you identify and understand "arbitrage," "sandwich," and “liquidation" types of transactions.

In version 1.4, the extension supports users to load detailed token flow graphs on Etherscan (and many blockchain explorers, check details below) transaction pages based on any selected transaction, which will give you more insights into what the transaction does and how the transaction is operated. 

By clicking "Load Transfer Flow Chart",  a chart will be loaded automatically under "value section" of the transaction page, which visualizes the "tokens transferred" section. 
- Ellipse stands for address of blockchains;
- Arrows between nodes stand for token transfers;
- More legends, please visit https://tx.eigenphi.io/;
- Each node and line can be clicked to view details;

Also, if you want to check more information, you can be directed to the full analyze tool page by clicking "Open in EigenTx" to view more. 

We support explorers of blockchains, including :
- Ethereum (https://etherscan.io)
- BSC (https://bscscan.com)
- Avalanche (C chain, https://snowtrace.io)
- Polygon (https://polygonscan.com)
- Arbitrum (https://arbiscan.io)
- Optimism (https://optimistic.etherscan.io)
- Fantom (https://ftmscan.com)
- Cronos (https://cronoscan.com)

EigenTx is an open-sourced project, view the source code in GitHub repository by clicking the "About EigenTx Extension" button.You can find our Privacy Policy Terms at https://github.com/eigenphi/EigenTx-extension/blob/main/PrivacyPolicy.md

If you need any help, please contact us via twitter (https://twitter.com/eigenphi) .


Screenshot:

![screenshot](doc/images/screenshot.gif)

## License info

MIT (See LICENSE.txt file for details).
