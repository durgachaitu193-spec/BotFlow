import React from "react";

const HydrationLink = ({
  hydradxId,
  className,
}: {
  hydradxId?: string;
  className?: string;
}) => {
  return (
    <div
      className={`px-4 py-2 bg-[#BBFBD3] text-black font-bold text-base rounded-xl ${className}`}
    >
      Pool is seeded, view the coin on{" "}
      <span>
        <a
          target="_blank"
          href={`https://app.hydration.net/trade/swap?assetIn=${hydradxId || 1000222}&assetOut=5`}
          className="underline"
          rel="noreferrer"
        >
          Hydration
        </a>
      </span>
    </div>
  );
};

export default HydrationLink;
