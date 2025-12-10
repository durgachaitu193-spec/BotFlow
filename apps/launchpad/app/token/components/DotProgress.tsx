import { OG_AMOUNT } from "@/global/constants";
import { Progress } from "antd";
import React from "react";
import BN from "bn.js";

const getPercentage = (currentAmount: BN) => {
  if (currentAmount.isZero()) return 0;
  if (currentAmount.gte(OG_AMOUNT)) return 100;
  const total = OG_AMOUNT; // also in BN
  // calculate the percentage
  return currentAmount.mul(new BN(100)).div(total).toNumber();
};

const DotProgress = ({ reserveBalance }: { reserveBalance: string }) => {
  const percentage = getPercentage(new BN(reserveBalance));
  return (
    <div className="flex flex-col gap-y-3">
      <p className="font-bold text-[20px] text-heading">
        Ride the BNB Wave progress: {percentage}%
      </p>
      <Progress
        showInfo={false}
        strokeWidth={25}
        className="w-full"
        percent={percentage}
        trailColor="#1D2132"
        strokeColor="#EBB305"
      />
    </div>
  );
};

export default DotProgress;
