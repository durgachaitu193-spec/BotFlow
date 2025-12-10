"use client";

import "./style.css";
import { CLIENT_DB_COLLECTIONS, IToken } from "@/global/types";
import NextLink from "next/link";
const Link = NextLink as any;
import React, { useEffect, useState } from "react";
import Loader from "@/ui-components/Loader";
import Address from "@/ui-components/Address";
import PrimaryButton from "@/ui-components/PrimaryButton";
import Input from "@/ui-components/Input";
import { useUserDetailsContext } from "@/context";
import Holdings from "@/address/Components/Holdings";
// import { skip } from "node:test";

export enum ETabs {
  TERMINAL = "Terminal",
  HYDRATION = "Hydration",
  HOLDINGS = "Holdings",
}

function TokenList() {
  const [loading, setLoading] = useState<boolean>(true);
  const [tokens, setTokens] = useState<Array<IToken>>([]);

  const { address } = useUserDetailsContext();

  const [tokensFiltered, setTokensFiltered] = useState<Array<IToken>>([]);

  const [search, setSearch] = useState<string>("");

  const [tab, setTab] = useState<ETabs>(ETabs.TERMINAL);

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/v1/token");
      const data = await response.json();
      if (data && data.tokens) {
        setTokens(data.tokens);
        setTokensFiltered(data.tokens);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    }
  };

  useEffect(() => {
    fetchTokens().finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tokens) {
      const copy = [...tokens];

      const filtered = copy.filter(
        (item) =>
          item.symbol.toLowerCase().includes(search.toLowerCase()) ||
          item.name.toLowerCase().includes(search.toLowerCase()),
      );

      if (filtered && filtered.length > 0) {
        setTokensFiltered(filtered);
      } else {
        setTokensFiltered(tokens);
      }
    }
  }, [search]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="px-4 sm:px-[80px]">
      <div className="mt-4 mb-10 w-full flex justify-center">
        <Input
          placeholder="Search"
          className="search-bar rounded-xl w-full sm:w-[400px] text-black bg-white"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          suffix={
            <img
              src="/assets/arrow-right.png"
              alt="arrow"
              height={24}
              width={24}
            />
          }
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 font-Agrandir text-xs font-extrabold mb-8">
        <PrimaryButton
          className={`${tab === ETabs.TERMINAL ? "bg-[#5030DB]" : "bg-[#484261]"} shadow-[#8952F5] px-6`}
          onClick={() => setTab(ETabs.TERMINAL)}
        >
          {ETabs.TERMINAL}
        </PrimaryButton>
        {/* <PrimaryButton className={`${tab === ETabs.HYDRATION ? 'bg-[#5030DB]' : 'bg-[#484261]'} shadow-[#8952F5] px-6`} onClick={() => setTab(ETabs.HYDRATION)}>{ETabs.HYDRATION}</PrimaryButton> */}
        {address && (
          <PrimaryButton
            className={`${tab === ETabs.HOLDINGS ? "bg-[#5030DB]" : "bg-[#484261]"} shadow-[#8952F5] px-6`}
            onClick={() => setTab(ETabs.HOLDINGS)}
          >
            {ETabs.HOLDINGS}
          </PrimaryButton>
        )}
      </div>
      {tab === ETabs.TERMINAL ? (
        <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {tokensFiltered.map((token) => (
            <Link href={`/token/${token.id}`} key={token.id}>
              <div className="token-card p-2 flex items-start gap-x-2 text-white bg-transparent">
                <img
                  src={token.logo || "/assets/meme-image.png"}
                  alt="Coin image"
                  height={118}
                  width={120}
                  className="max-h-[120px] max-w-[120px]"
                />
                <div className="h-full flex flex-col gap-y-1">
                  <span className="flex items-center gap-x-2">
                    Created By:{" "}
                    <Address
                      address={token.createdBy}
                      startChars={4}
                      endChars={4}
                    />
                  </span>
                  <span className="break-all max-w-[300px] font-bold text-base mb-2 text-primary">
                    {token.name} [ticker: {token.symbol} ]
                  </span>
                  <span className="break-all max-w-[300px] text-sm">
                    {token.description}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : tab === ETabs.HYDRATION ? (
        <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {tokensFiltered
            .filter((item) => item.tradeDisabled)
            .map((token) => (
              <Link href={`/token/${token.id}`} key={token.id}>
                <div className="token-card p-2 flex items-start gap-x-2 text-white bg-transparent">
                  <img
                    src={token.logo || "/assets/meme-image.png"}
                    alt="Coin image"
                    height={118}
                    width={120}
                    className="max-h-[120px] max-w-[120px]"
                  />
                  <div className="h-full flex flex-col gap-y-1">
                    <span className="flex items-center gap-x-2">
                      Created By:{" "}
                      <Address
                        address={token.createdBy}
                        startChars={4}
                        endChars={4}
                      />
                    </span>
                    <span className="break-all max-w-[300px] font-bold text-base mb-2 text-primary">
                      {token.name} [ticker: {token.symbol} ]
                    </span>
                    <span className="break-all max-w-[300px] text-sm">
                      {token.description}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      ) : (
        <Holdings />
      )}
    </div>
  );
}

export default TokenList;
