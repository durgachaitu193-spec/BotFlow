"use client";
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Layout as AntLayout } from "antd";
import NavHeader from "./NavHeader";
import CustomFooter from "./Footer";
import Banner from "../Banner";

import LocalizedFormat from "dayjs/plugin/localizedFormat";
import dayjs from "dayjs";
import Address from "../Address";

dayjs.extend(LocalizedFormat);

const { Header, Footer, Content } = AntLayout;

const styles = {
  layoutStyle: "bg-black",
  headerStyle:
    "w-full px-4 py-2 bg-black text-white sticky top-0 left-0 z-[100]",
  contentStyle: "py-4 bg-black",
  footerStyle:
    "h-[50px] bg-black text-white flex items-center justify-center sm:px-[100px] px-[40px] sticky bottom-0 left-0 z-[100]",
};

function Layout({ children }: PropsWithChildren) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [txns, setTxns] = useState<any[]>([]);

  const formatDate = (
    date: string | { seconds: number } | { toDate: () => Date },
  ): string => {
    if (!date) return "";
    if (typeof date === "string") {
      return dayjs(date).format("DD/MM/YYYY");
    }
    if ("seconds" in date) {
      return dayjs.unix(date.seconds).format("DD/MM/YYYY");
    }
    if (date?.toDate) {
      return dayjs(date.toDate()).format("DD/MM/YYYY");
    }
    return "";
  };

  const fetchTxns = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/transactions");
      if (response.ok) {
        const data = await response.json();
        const transactionsArray = data.transactions || [];

        setTxns(
          transactionsArray
            .map((item: any) => ({
              ...item,
              createdAt: formatDate(item.createdAt),
            }))
            .sort((a: any, b: any) =>
              dayjs(a.createdAt, "DD/MM/YYYY").isBefore(
                dayjs(b.createdAt, "DD/MM/YYYY"),
              )
                ? 1
                : -1,
            ),
        );
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  const components =
    txns && txns.length > 0
      ? txns.map((item, i) => {
          return {
            component: (
              <span
                key={i}
                className={`flex items-center gap-x-2 rounded-lg py-2 ${
                  i % 2 === 0 ? "bg-primary" : "bg-secondary"
                } text-black pr-5 font-bold whitespace-nowrap`}
              >
                {item.type === "created" ? (
                  <>
                    <Address address={item.to} startChars={4} endChars={4} />{" "}
                    created ${item.tokenId} on {item.createdAt}
                  </>
                ) : (
                  <>
                    <Address address={item.to} startChars={4} endChars={4} />{" "}
                    {item.type === "sell" ? "sold" : "bought"} $
                    {item.symbol ? item.symbol : item.tokenId} on{" "}
                    {item.createdAt}
                  </>
                )}
              </span>
            ),
          };
        })
      : [];

  const { layoutStyle, headerStyle, contentStyle, footerStyle } = styles;

  return (
    <AntLayout className={layoutStyle}>
      <Header className={headerStyle}>
        <NavHeader />
      </Header>
      <Content
        style={{ minHeight: "calc(100vh - 50px - 64px)" }}
        className={contentStyle}
      >
        <div className="max-w-[1800px] mx-auto">
          <Banner components={components} />
          {children}
        </div>
      </Content>
      <Footer className={footerStyle}>
        <CustomFooter />
      </Footer>
    </AntLayout>
  );
}

export default Layout;
