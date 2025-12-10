export default function formatBigNumbers(usd: string) {
  // Nine Zeroes for Billions
  const formattedUSD =
    Math.abs(Number(usd)) >= 1.0e9
      ? `${(Math.abs(Number(usd)) / 1.0e9).toFixed(2)}B`
      : // Six Zeroes for Millions
        Math.abs(Number(usd)) >= 1.0e6
        ? `${(Math.abs(Number(usd)) / 1.0e6).toFixed(2)}M`
        : // Three Zeroes for Thousands
          Math.abs(Number(usd)) >= 1.0e3
          ? `${(Math.abs(Number(usd)) / 1.0e3).toFixed(2)}K`
          : Math.abs(Number(usd));

  return formattedUSD.toString();
}
