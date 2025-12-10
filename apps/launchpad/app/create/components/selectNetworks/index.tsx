"use client";
import { useApiContext } from "@/context";
import { networkConstants } from "@/global/networkConstants";
import { Select } from "antd";
import React from "react";

function SelectNetwork() {
  const { network, apiReady, setNetwork } = useApiContext();
  const networks = Object.keys(networkConstants);
  return (
    <div className="flex flex-col justify-center items-center">
      {apiReady ? (
        <div>Connected Network: {network}</div>
      ) : (
        <div>loading...</div>
      )}
      <Select onChange={(value) => setNetwork(value)} value={network}>
        {networks.map((network) => (
          <Select.Option value={network} key={network}>
            {network}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}

export default SelectNetwork;
