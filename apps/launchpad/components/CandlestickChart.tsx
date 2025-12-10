"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  Time,
} from "lightweight-charts";
import { ITransaction } from "@/global/types";
import { parseTransactionDataOHLC } from "@/global/utils/paraseTranasctionData";

const generateCandlestickData = (days: number) => {
  const data = [];
  const volumeData = [];
  let basePrice = 1.24;
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 24 * 60 * 60;

  for (let i = days; i >= 0; i--) {
    const time = now - i * dayInSeconds;

    const open = basePrice;
    const volatility = 0.08;
    const change = (Math.random() - 0.48) * volatility;
    const high = open + Math.abs(Math.random() * volatility * 0.7);
    const low = open - Math.abs(Math.random() * volatility * 0.7);
    const close = Math.max(low, Math.min(high, open + change));

    basePrice = close;

    data.push({
      time: time as Time,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
    });

    const volume = Math.random() * 5000000 + 1000000;
    volumeData.push({
      time: time as Time,
      value: parseFloat(volume.toFixed(0)),
      color:
        close >= open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
    });
  }

  return { candlestickData: data, volumeData };
};

const timeframes = [
  { label: "1D", days: 1 },
  { label: "5D", days: 5 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

interface CandlestickChartProps {
  id?: string;
}

export default function CandlestickChart({ id }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      const fetchTransactions = async () => {
        try {
          const response = await fetch(`/api/v1/transactions?tokenId=${id}`);
          const data = await response.json();
          if (data && data.transactions) {
            const docs = data.transactions as ITransaction[];
            const ohlcData = parseTransactionDataOHLC(docs);
            setChartData(ohlcData);
          }
        } catch (error) {
          console.error("Error fetching transactions:", error);
        }
      };
      fetchTransactions();
    }
  }, [id]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9CA3AF",
      },
      grid: {
        vertLines: { color: "#1F2937", style: 1 },
        horzLines: { color: "#1F2937", style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: {
        borderColor: "#2D3748",
      },
      timeScale: {
        borderColor: "#2D3748",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#6B7280",
          width: 1,
          style: 3,
          labelBackgroundColor: "#F26522",
        },
        horzLine: {
          color: "#6B7280",
          width: 1,
          style: 3,
          labelBackgroundColor: "#F26522",
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
    });

    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeriesRef.current = volumeSeries;

    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    if (id && chartData.length > 0) {
      // Use real data
      candlestickSeries.setData(chartData as any);
      // For now, we don't have volume data in the same format, so we can skip or mock it
      // volumeSeries.setData(volumeData);
    } else if (!id) {
      // Use dummy data
      const timeframeDays =
        timeframes.find((tf) => tf.label === selectedTimeframe)?.days || 30;
      const { candlestickData, volumeData } =
        generateCandlestickData(timeframeDays);
      candlestickSeries.setData(candlestickData);
      volumeSeries.setData(volumeData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [selectedTimeframe, id, chartData]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {timeframes.map((tf) => (
          <button
            key={tf.label}
            onClick={() => handleTimeframeChange(tf.label)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTimeframe === tf.label
                ? "bg-accent-primary/20 text-accent-primary"
                : "bg-bg-surface text-text-secondary hover:bg-white/5 hover:text-white"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div
        ref={chartContainerRef}
        className="flex-1 w-full rounded-lg min-h-[300px]"
      />
    </div>
  );
}
