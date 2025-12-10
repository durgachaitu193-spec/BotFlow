import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { shortenAddress } from "@/global/utils/shortenAddress";

ChartJS.register(ArcElement, Tooltip);

const DonutChart = ({
  holders,
}: {
  holders: { address: string; percentage: string }[];
}) => {
  const holdersData = holders.slice(0, 4).map((item, i) => ({
    label: shortenAddress({ text: item.address, startChars: 4, endChars: 4 }),
    value: Number(item.percentage),
    color: i === 0 ? "#FF4906" : "#39CEF3",
  }));

  if (holders.length > 4) {
    const others = holders.slice(4).reduce(
      (prev, item) => {
        let val = prev.value;
        val = val + Number(item.percentage);
        prev = { ...prev, value: val };
        return prev;
      },
      { label: "Others", value: 0, color: "#87EFAC" },
    );

    holdersData.push(others);
  }

  const data = {
    labels: holdersData?.map((item) => item.label),
    datasets: [
      {
        label: "Percentage",
        data: holdersData?.map((item) => item.value),
        backgroundColor: holdersData.map((item) => item.color),
        borderWidth: 0,
        cutout: 45,
        borderRadius: 6,
        spacing: holdersData.length > 1 ? 5 : 0,
        // rotation: -180
      },
    ],
  };

  return (
    <div className="h-[150px] w-[full] flex justify-center">
      <Doughnut
        data={data}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                usePointStyle: true,
                boxHeight: 5,
                boxWidth: 5,
                color: "#ffffff",
                font: {
                  size: 14,
                },
              },
            },
          },
        }}
      />
    </div>
  );
};

export default DonutChart;
