/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

"use client";

import { Wallet } from "@/global/types";
import React from "react";
import NextImage from "next/image";
const Image = NextImage as any;

interface Props {
  className?: string;
  onWalletClick: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    wallet: Wallet,
  ) => void;
  disabled?: boolean;
}

function WalletButtons({ className, onWalletClick, disabled = false }: Props) {
  // const [showMore, setShowMore] = useState(false);

  // const wallets = Object.values(Wallet);

  // const handleShowMore = () => {
  //   setShowMore(!showMore);
  // };

  return (
    <div className={`${className} flex items-center justify-center gap-3`}>
      <button
        className="flex flex-col items-center justify-start border-0 shadow-none bg-transparent px-5"
        onClick={(e: any) => onWalletClick(e, Wallet.POLKADOT)}
        disabled={disabled}
      >
        <Image
          src={`/assets/icons/wallets/${Wallet.POLKADOT.toLowerCase()}.svg`}
          alt={Wallet.POLKADOT}
          width={28}
          height={28}
        />
        <span>Polkadot Js</span>
      </button>
      <button
        className="flex flex-col items-center justify-start border-0 shadow-none bg-transparent px-5"
        onClick={(e: any) => onWalletClick(e, Wallet.SUBWALLET)}
        disabled={disabled}
      >
        <Image
          src={`/assets/icons/wallets/${Wallet.SUBWALLET.toLowerCase()}.svg`}
          alt={Wallet.SUBWALLET}
          width={28}
          height={28}
        />
        <span>Subwallet</span>
      </button>
      <button
        className="flex flex-col items-center justify-start border-0 shadow-none bg-transparent px-5"
        onClick={(e: any) => onWalletClick(e, Wallet.TALISMAN)}
        disabled={disabled}
      >
        <Image
          src={`/assets/icons/wallets/${Wallet.TALISMAN.toLowerCase()}.svg`}
          alt={Wallet.TALISMAN}
          width={28}
          height={28}
        />
        <span>Talisman</span>
      </button>
      {typeof window !== "undefined" &&
        (window as any).walletExtension?.isNovaWallet && (
          <button
            className="flex flex-col items-center justify-start border-0 shadow-none bg-transparent px-5"
            onClick={(e: any) => onWalletClick(e, Wallet.NOVAWALLET)}
            disabled={disabled}
          >
            <Image
              src={`/assets/icons/wallets/nova.jpg`}
              alt={Wallet.NOVAWALLET}
              width={28}
              height={28}
            />
            <span>Nova Wallet</span>
          </button>
        )}
      {/* {wallets.length > 3 && (
        <Button onClick={handleShowMore} className="w-full bg-transparent px-5">
          {showMore ? "Show Less" : "Show More"}
        </Button>
      )} */}
    </div>
  );
}

export default WalletButtons;
