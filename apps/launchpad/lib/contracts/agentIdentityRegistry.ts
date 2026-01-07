import { ethers } from 'ethers'

export const AGENT_IDENTITY_REGISTRY_ADDRESS = '0x449328eFeCb2990d2D5Fc67923aA7CDCa97C2620'

export const AGENT_IDENTITY_REGISTRY_ABI = [
  'function getAgent(uint256 agentId) external view returns (tuple(uint256 agentId, address agentWallet, address ownerWallet, string userDID, string agentDID, string metadata, bool isActive, uint256 registeredAt, address tokenAddress, string tokenName, string tokenSymbol, string tokenIpfsHash))',
  'function getAgentByDID(string calldata agentDID) external view returns (tuple(uint256 agentId, address agentWallet, address ownerWallet, string userDID, string agentDID, string metadata, bool isActive, uint256 registeredAt, address tokenAddress, string tokenName, string tokenSymbol, string tokenIpfsHash))',
  'function getAgentIdByWallet(address agentWallet) external view returns (uint256)',
  'function getAgentIdByToken(address tokenAddress) external view returns (uint256)',
]

export function getAgentIdentityRegistryContract(provider: ethers.providers.Provider) {
  return new ethers.Contract(AGENT_IDENTITY_REGISTRY_ADDRESS, AGENT_IDENTITY_REGISTRY_ABI, provider)
}
