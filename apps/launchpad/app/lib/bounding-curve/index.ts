import { BN } from '@polkadot/util'
import { INITIAL_TOKEN_PRICE, TOKEN_DECIMAL } from '@/global/constants'

// const CURVE_PRECISION = new BN(10).pow(new BN(5)).mul(new BN(3));
const DECIMALS = new BN(TOKEN_DECIMAL)
const EXPONENT = new BN(50000).pow(new BN(2))
export const SELLING_EXPONENT = new BN(40000).pow(new BN(2))
const PRECISION = new BN(10).pow(new BN(10)) // Precision factor
export const SCALING_FACTOR = new BN(10).pow(DECIMALS)

const calculateTotalCost = (currentSupply: BN, amount: BN, reserveBalance: BN) => {
  if (amount.isZero()) {
    return { cost: new BN(0), reserveBalance }
  }
  const S = currentSupply.div(SCALING_FACTOR)
  const deltaS = amount

  const linearComponent = INITIAL_TOKEN_PRICE.mul(deltaS)
  const curveComponent = deltaS
    .mul(S.mul(new BN(2)).add(deltaS).sub(new BN(1)))
    .div(new BN(2))
    .mul(EXPONENT)
    .div(PRECISION)

  const totalCost = linearComponent.add(curveComponent)
  return { cost: totalCost, reserveBalance: reserveBalance.add(totalCost) }
}

const calculateTotalSellingCost = (currentSupply: BN, amount: BN, reserveBalance: BN) => {
  if (amount.isZero()) {
    return { cost: new BN(0), reserveBalance }
  }
  const S = currentSupply.div(SCALING_FACTOR)

  // Calculate the initial and final supply
  const finalSupply = S.sub(amount)
  if (finalSupply.isNeg()) {
    return { cost: new BN(0), reserveBalance, maxExceed: true }
  }

  // Calculate revenue from linear component
  const linearComponent = INITIAL_TOKEN_PRICE.mul(amount)

  // Calculate revenue from the curve component, reversed from buying
  const curveComponent = amount
    .mul(S.add(finalSupply).sub(new BN(1)))
    .div(new BN(2))
    .mul(SELLING_EXPONENT)
    .div(PRECISION)

  // Calculate total revenue from selling the tokens
  const totalRevenue = linearComponent.add(curveComponent)

  return {
    cost: totalRevenue,
    reserveBalance: reserveBalance.sub(totalRevenue),
  }
}

// -----------------------------------------------------------------------------------------------------------------------------

// // Utility functions

// function mathPow(x: any, a: any) {
//   const result = Math.pow(x, a);
//   const resultString = result.toString();

//   if (resultString.includes("e")) {
//     // Handle scientific notation
//     const [coefficient, exponent] = resultString.split("e");
//     const adjustedCoefficient = coefficient.replace(".", "").replace(/^0+/, "");
//     const adjustedExponent =
//       parseInt(exponent) - (adjustedCoefficient.length - 1);

//     if (adjustedExponent >= 0) {
//       return adjustedCoefficient + "0".repeat(adjustedExponent);
//     } else {
//       return (
//         adjustedCoefficient.slice(0, adjustedExponent) +
//         "." +
//         adjustedCoefficient.slice(adjustedExponent)
//       );
//     }
//   } else {
//     // Handle regular number
//     return resultString.split(".")[0];
//   }
// }
// const pow3 = (x: any) => new BN(mathPow(x, 1.61));

// const calculateTotalCost = (
//   currentSupply: BN,
//   amount: BN,
//   reserveBalance: BN
// ) => {
//   console.log("🚀 ~ calculateTotalCost ~ reserveBalance:", reserveBalance);
//   // amount = amount.div(SCALING_FACTOR);
//   const newTotal = currentSupply.add(amount);
//   console.log("🚀 ~ calculateTotalCost ~ amount:", amount.toString());

//   const newTotalCubic = pow3(newTotal);
//   console.log(
//     "🚀 ~ calculateTotalCost ~ newTotalCubic:",
//     newTotalCubic.toString()
//   );

//   const cost = newTotalCubic
//     .div(new BN(3))
//     .div(SCALING_FACTOR)
//     // .div(SCALING_FACTOR)
//     .sub(reserveBalance)
//     .div(CURVE_PRECISION);

//   console.log("🚀 ~ calculateTotalCost ~ cost:", cost.toString());

//   reserveBalance = reserveBalance.add(cost);
//   console.log(
//     "🚀 ~ calculateTotalCost ~ reserveBalance:",
//     reserveBalance.toString()
//   );
//   return { cost, reserveBalance };
// };

// const calculateTotalSellingCost = (
//   currentSupply: BN,
//   amount: BN,
//   reserveBalance: BN
// ) => {
//   const newTotal = currentSupply.sub(amount);

//   const cost = reserveBalance.sub(
//     pow3(newTotal)
//       .div(new BN(3))
//       .div(SCALING_FACTOR)
//       .div(SCALING_FACTOR)
//       .div(CURVE_PRECISION)
//   );
//   reserveBalance = reserveBalance.sub(cost);
//   return { cost, reserveBalance };
// };

// // Example usage
// let currentSupply = new BN(0).mul(SCALING_FACTOR);
// let reserveBalance = new BN(0).mul(SCALING_FACTOR);

// console.log("Initial state:");
// console.log("Current supply:", currentSupply.toString());
// console.log("Reserve balance:", reserveBalance.toString());

// // Buy 1 token
// const MILLION = new BN(500000000);
// const ONE = new BN("1");
// const buyAmount1 = new BN(MILLION).mul(SCALING_FACTOR);
// console.log("\nBuying  tokens:");
// const result1 = calculateTotalCost(currentSupply, buyAmount1, reserveBalance);
// console.log("res : ", result1.cost.div(SCALING_FACTOR).toString());
// console.log("Cost to buy in token decimals:", result1.cost.toString());
// currentSupply = currentSupply.add(buyAmount1);
// reserveBalance = result1.reserveBalance;

// // Buy 500k tokens
// console.log("\nBuying 500k tokens:");
// const buyAmount2 = new BN(500000).mul(SCALING_FACTOR);
// const result2 = calculateTotalCost(currentSupply, buyAmount2, reserveBalance);
// console.log("Cost to buy 500k tokens:", result2.cost.toString());
// currentSupply = currentSupply.add(buyAmount2);
// reserveBalance = result2.reserveBalance;

// // Sell 100k tokens
// console.log("\nSelling 100k tokens:");
// const sellAmount1 = new BN(100000).mul(SCALING_FACTOR);
// const sellResult1 = calculateTotalSellingCost(
//   currentSupply,
//   sellAmount1,
//   reserveBalance
// );
// console.log("Refund for selling 100k tokens:", sellResult1.cost.toString());
// currentSupply = currentSupply.sub(sellAmount1);
// reserveBalance = sellResult1.reserveBalance;

// // Buy 10k tokens
// console.log("\nBuying 10k tokens:");
// const buyAmount3 = new BN(10000).mul(SCALING_FACTOR);
// const result3 = calculateTotalCost(currentSupply, buyAmount3, reserveBalance);
// console.log("Cost to buy 10k tokens:", result3.cost.toString());
// currentSupply = currentSupply.add(buyAmount3);
// reserveBalance = result3.reserveBalance;

// Final state
// console.log("\nFinal state:");
// console.log("Current supply:", currentSupply.toString());
// console.log(
//   "Reserve balance in DOT:",
//   reserveBalance.div(SCALING_FACTOR).toString()
// );
// export { calculateTotalCost, calculateTotalSellingCost };

export { calculateTotalCost, calculateTotalSellingCost }
