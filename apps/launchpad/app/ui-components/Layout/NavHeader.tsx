import NextImage from "next/image";
const Image = NextImage as any;
import React, { useState } from "react";
import SecondaryButton from "../SecondaryButton";
import LoginModal from "@/global/Modals/LoginModal";
import { useUserDetailsContext } from "@/context";
import Address from "../Address";
import NextLink from "next/link";
const Link = NextLink as any;
import { Popover } from "antd";
import { DownOutlined } from "@ant-design/icons";
import logout from "@/global/utils/logout";
import { useRouter } from "next/navigation";

import { Wallet } from "@/global/types";

const NavHeader = () => {
  const [openModal, setOpenModal] = useState(false);
  const { address, wallet, setUserDetails } = useUserDetailsContext();
  const router = useRouter();

  const handleDisconnect = () => {
    logout();

    setUserDetails({
      wallet: Wallet.NotConnected,
      address: "",
      userId: null,
    });

    router.push("/");
  };

  return (
    <>
      <LoginModal open={openModal} onClose={() => setOpenModal(false)} />
      <div className="flex items-center justify-between px-2 w-full h-full">
        <Link href="/">
          <Image
            src="/assets/pill-logo.png"
            alt="logo"
            width={40}
            height={40}
          />
        </Link>
        <Link href="/" className="hidden sm:block">
          <Image
            src="/assets/onlyfun-logo.png"
            alt="logo"
            width={180}
            height={30}
          />
        </Link>
        {/* {address && wallet !== Wallet.NotConnected && !isDisconnected ? (
          <div className="flex items-center">
            <Popover
              trigger="click"
              arrow={false}
              content={
                <div className="flex flex-col gap-y-4 items-center">
                  <Link href={`/address/${address}`}>
                    <SecondaryButton>Profile</SecondaryButton>
                  </Link>
                  <SecondaryButton
                    className="hover:text-red-500 [&>span]:hover:text-red-500"
                    onClick={handleDisconnect}
                  >
                    Disconnect Wallet
                  </SecondaryButton>
                </div>
              }
            >
              <div className="flex items-center gap-x-2 cursor-pointer relative">
                <Address address={address} startChars={4} endChars={4} />
                <DownOutlined />
              </div>
            </Popover>
          </div>
        ) : (
          <ConnectWallet />
        )} */}
      </div>
    </>
  );
};

export default NavHeader;
