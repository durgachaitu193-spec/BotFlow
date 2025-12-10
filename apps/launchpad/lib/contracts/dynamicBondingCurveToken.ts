import { ethers } from "ethers";

export const DYNAMIC_BONDING_CURVE_TOKEN_ABI = [
  "function buyTokens(address recipient, uint256 amount) external payable",
  "function sellTokens(address seller, uint256 amount) external",
  "function calculateTotalCost(uint256 currentSupply, uint256 amount) public pure returns (uint256)",
  "function calculateTotalSellingCost(uint256 currentSupply, uint256 amount) public pure returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function SCALING_FACTOR() external view returns (uint256)",
];

export function getDynamicBondingCurveTokenContract(
  address: string,
  provider: ethers.providers.Provider | ethers.Signer,
) {
  return new ethers.Contract(
    address,
    DYNAMIC_BONDING_CURVE_TOKEN_ABI,
    provider,
  );
}
