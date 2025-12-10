import { Wallet } from "@/global/types";
import { nextApiFetch } from "@/global/utils/nextApiFetch";

interface ILoginArgs {
  address: string;
  wallet: Wallet;
  signature: string;
}

export const login = async ({
  address,
  wallet,
  signature,
}: ILoginArgs): Promise<{ data?: { address: string }; error?: string }> => {
  return nextApiFetch({
    url: "api/v1/auth/login",
    method: "POST",
    data: {
      address,
      signature,
      wallet,
    },
  });
};
