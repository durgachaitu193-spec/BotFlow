// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicBondingCurveToken is ERC20, Ownable {
    uint256 public constant INITIAL_TOKEN_PRICE = 0.0000000000000256 ether; 
    uint256 public constant EXPONENT = 50000 * 50000;
    uint256 public constant SELLING_EXPONENT = 40000 * 40000;
    uint256 public constant PRECISION = 1e10;
    uint256 public constant SCALING_FACTOR = 1e18;

    uint256 public reserveBalance;
    bool public isInitialized = false;

    string private _customName;
    string private _customSymbol;

    constructor() ERC20("TempName", "TMP") Ownable(msg.sender) {}

    function initialize(string memory name_, string memory symbol_) public onlyOwner {
        require(!isInitialized, "Token is already initialized");
        _customName = name_;
        _customSymbol = symbol_;
        isInitialized = true;
    }

    function name() public view override returns (string memory) {
        return _customName;
    }

    function symbol() public view override returns (string memory) {
        return _customSymbol;
    }

    function calculateTotalCost(uint256 currentSupply, uint256 amount) public pure returns (uint256) {
        if (amount == 0) return 0;
        uint256 S = currentSupply / SCALING_FACTOR;
        uint256 deltaS = amount;

        uint256 linearComponent = INITIAL_TOKEN_PRICE * deltaS;
        uint256 curveComponent = (deltaS * ((2 * S) + deltaS - 1) / 2) * EXPONENT / PRECISION;

        return linearComponent + curveComponent;
    }

    function calculateTotalSellingCost(uint256 currentSupply, uint256 amount) public pure returns (uint256) {
        if (amount == 0) return 0;

        uint256 S = currentSupply / SCALING_FACTOR;
        require(S >= amount, "Amount to sell exceeds current supply");

        uint256 finalSupply = S - amount;
        uint256 linearComponent = INITIAL_TOKEN_PRICE * amount;
        uint256 curveComponent = (amount * (S + finalSupply - 1) / 2) * SELLING_EXPONENT / PRECISION;

        return linearComponent + curveComponent;
    }
    
    function buyTokens(address recipient, uint256 amount) external payable {
        require(isInitialized, "Token not initialized");
        
        uint256 cost = calculateTotalCost(totalSupply(), amount);
        require(msg.value >= cost, "Insufficient Ether sent");

        _mint(recipient, amount * SCALING_FACTOR);
        reserveBalance += cost; 

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }


    function sellTokens(address seller, uint256 amount) external {
        uint256 scaledAmount = amount * SCALING_FACTOR;
        require(balanceOf(seller) >= scaledAmount, "Insufficient token balance");

        uint256 revenue = calculateTotalSellingCost(totalSupply(), amount);
        require(reserveBalance >= revenue, "Not enough reserve balance");

        _burn(seller, scaledAmount);
        reserveBalance -= revenue;

        payable(seller).transfer(revenue);
    }

    receive() external payable {
        reserveBalance += msg.value; 
    }
}
