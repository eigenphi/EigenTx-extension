export function parseTx(url: string) {
  const supportUrls = [
    "https://etherscan.io/tx/",
    "https://bscscan.com/tx/",
    "https://snowtrace.io/tx/",
    "https://polygonscan.com/tx/",
    "https://arbiscan.io/tx/",
    "https://optimistic.etherscan.io/tx/",
    "https://ftmscan.com/tx/",
    "https://cronoscan.com/tx/",
  ];

  if (supportUrls.find((item) => url.startsWith(item))) {
    return url.match(/(0x\w+)/)[0];
  }
}
