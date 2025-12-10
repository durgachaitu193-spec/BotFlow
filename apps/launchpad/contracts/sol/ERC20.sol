// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DynamicBondingCurveToken.sol";  

contract TokenFactory {
    struct TokenDetails {
        string name;
        string symbol;
        string ipfsHash;
    }
    
    DynamicBondingCurveToken[] private createdTokens;
    mapping(address => TokenDetails) public tokenInfo;

    event TokenCreated(address indexed tokenAddress, string name, string symbol, string ipfsHash);

    uint256 public constant MINTING_FEE = 0.01 ether;

    function createToken(string memory tokenName, string memory tokenSymbol, string memory tokenIpfsHash) external payable returns (address) {
        require(msg.value >= MINTING_FEE, "Insufficient Ether sent for minting fee");

        DynamicBondingCurveToken newToken = new DynamicBondingCurveToken();
        
        newToken.initialize(tokenName, tokenSymbol);
        newToken.transferOwnership(msg.sender);

        createdTokens.push(newToken);
        tokenInfo[address(newToken)] = TokenDetails(tokenName, tokenSymbol, tokenIpfsHash);
        
        emit TokenCreated(address(newToken), tokenName, tokenSymbol, tokenIpfsHash);

        if (msg.value > MINTING_FEE) {
            payable(msg.sender).transfer(msg.value - MINTING_FEE);
        }
        
        return address(newToken);
    }

    function buytoken(string memory name, string memory symbol, uint256 amount) external payable {
        address tokenAddress = getTokenAddress(name, symbol);
        DynamicBondingCurveToken token = DynamicBondingCurveToken(payable(tokenAddress));
        
        token.buyTokens{value: msg.value}(msg.sender, amount);
    }


    function selltoken(string memory name, string memory symbol, uint256 amount) external {
        address tokenAddress = getTokenAddress(name, symbol);
        DynamicBondingCurveToken token = DynamicBondingCurveToken(payable(tokenAddress));
        token.sellTokens(msg.sender, amount);
    }


    function calculateTotalCost(string memory name, string memory symbol, uint256 amount) external view returns (uint256) {
        address tokenAddress = getTokenAddress(name, symbol);
        DynamicBondingCurveToken token = DynamicBondingCurveToken(payable(tokenAddress));
        return token.calculateTotalCost(token.totalSupply(), amount);
    }

    function calculateTotalSellingCost(string memory name, string memory symbol, uint256 amount) external view returns (uint256) {
        address tokenAddress = getTokenAddress(name, symbol);
        DynamicBondingCurveToken token = DynamicBondingCurveToken(payable(tokenAddress));
        return token.calculateTotalSellingCost(token.totalSupply(), amount);
    }

    function getTokenCount() external view returns (uint256) {
        return createdTokens.length;
    }

    function getToken(uint256 index) external view returns (address) {
        require(index < createdTokens.length, "Token index out of range");
        return address(createdTokens[index]);
    }

    function getTokenDetails(address tokenAddress) external view returns (string memory name, string memory symbol, string memory ipfsHash) {
        TokenDetails memory details = tokenInfo[tokenAddress];
        return (details.name, details.symbol, details.ipfsHash);
    }

    function getTokenAddress(string memory name, string memory symbol) public view returns (address) {
        for (uint256 i = 0; i < createdTokens.length; i++) {
            address tokenAddress = address(createdTokens[i]);
            TokenDetails memory details = tokenInfo[tokenAddress];
            
            // Use bytes for string comparison
            if (keccak256(bytes(details.name)) == keccak256(bytes(name)) && 
                keccak256(bytes(details.symbol)) == keccak256(bytes(symbol))) {
                return tokenAddress;
            }
        }
        revert("Token not found");
    }

    function getUserTokenBalance(string memory name, string memory symbol) external view returns (uint256 balance, string memory message) {
        address tokenAddress = getTokenAddress(name, symbol);
        require(tokenAddress != address(0), "Invalid token address");

        DynamicBondingCurveToken token = DynamicBondingCurveToken(payable(tokenAddress));
        
        // Get raw balance without scaling factor division
        uint256 rawBalance = token.balanceOf(msg.sender);
        
        if (rawBalance > 0) {
            return (rawBalance / token.SCALING_FACTOR(), "You have the token.");
        } else {
            return (0, "You do not have this token.");
        }
    }


    function debugTokenLookup(string memory name, string memory symbol) external view returns (
        bool exists,
        address foundAddress,
        string memory foundName,
        string memory foundSymbol
    ) {
        for (uint256 i = 0; i < createdTokens.length; i++) {
            address tokenAddress = address(createdTokens[i]);
            TokenDetails memory details = tokenInfo[tokenAddress];
            
            if (keccak256(bytes(details.name)) == keccak256(bytes(name)) && 
                keccak256(bytes(details.symbol)) == keccak256(bytes(symbol))) {
                return (true, tokenAddress, details.name, details.symbol);
            }
        }
        return (false, address(0), "", "");
    }

    function getAllTokenInformation() external view returns (TokenDetails[] memory) {
        TokenDetails[] memory allTokenDetails = new TokenDetails[](createdTokens.length);
        for (uint256 i = 0; i < createdTokens.length; i++) {
            address tokenAddress = address(createdTokens[i]);
            allTokenDetails[i] = tokenInfo[tokenAddress];
        }
        return allTokenDetails;
    }

    receive() external payable {}
}
