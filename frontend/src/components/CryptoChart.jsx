import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import axios from "axios";

const CryptoChart = ({ symbol = "BTCUSDT", interval = "1h", limit = 50 }) => {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const response = await axios.get(url);

        const candleSeries = response.data.map(candle => ({
          x: new Date(candle[0]),
          y: [
            parseFloat(candle[1]), // open
            parseFloat(candle[2]), // high
            parseFloat(candle[3]), // low
            parseFloat(candle[4]), // close
          ],
        }));

        // Create separate line series for OHLC
        const openSeries = response.data.map(candle => ({
          x: new Date(candle[0]),
          y: parseFloat(candle[1]) // open
        }));

        const highSeries = response.data.map(candle => ({
          x: new Date(candle[0]),
          y: parseFloat(candle[2]) // high
        }));

        const lowSeries = response.data.map(candle => ({
          x: new Date(candle[0]),
          y: parseFloat(candle[3]) // low
        }));

        const closeSeries = response.data.map(candle => ({
          x: new Date(candle[0]),
          y: parseFloat(candle[4]) // close
        }));

        // Calculate moving averages like in your professional chart
        const calculateMA = (data, period) => {
          return data.map((item, index) => {
            if (index < period - 1) return { x: item.x, y: null };
            const slice = data.slice(index - period + 1, index + 1);
            const average = slice.reduce((sum, candle) => sum + candle.y[3], 0) / period; // Use close price
            return { x: item.x, y: average };
          });
        };

        const ma5 = calculateMA(candleSeries, 5);
        const ma10 = calculateMA(candleSeries, 10);
        const ma30 = calculateMA(candleSeries, 30);

        setSeries([
          { 
            name: "Price",
            type: "candlestick",
            data: candleSeries 
          },
          {
            name: "MA5",
            type: "line",
            data: ma5
          },
          {
            name: "MA10", 
            type: "line",
            data: ma10
          },
          {
            name: "MA30",
            type: "line",
            data: ma30
          }
        ]);
      } catch (error) {
        console.error("Error fetching Binance data:", error);
      }
    };

    fetchCandles();
  }, [symbol, interval, limit]);

  const options = {
    chart: {
      type: "candlestick",
      height: 350,
      toolbar: { show: true },
      background: "#0a0a0a", // Very dark background like your image
      foreColor: "#666666", // Dark gray text
    },
    theme: {
      mode: "dark",
    },
    grid: {
      borderColor: "#1a1a1a", // Very dark grid lines
      strokeDashArray: 1,
    },
    xaxis: {
      type: "datetime",
      labels: { 
        style: { 
          colors: "#4a4a4a", // Dark gray labels
          fontSize: "11px"
        } 
      },
      axisBorder: {
        color: "#1a1a1a"
      },
      axisTicks: {
        color: "#1a1a1a"
      }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { 
        style: { 
          colors: "#4a4a4a", // Dark gray labels
          fontSize: "11px"
        } 
      },
      axisBorder: {
        color: "#1a1a1a"
      }
    },
    tooltip: {
      theme: "dark",
      x: { format: "dd MMM HH:mm" },
      y: {
        formatter: val => `$${val.toFixed(2)}`,
      },
      style: {
        fontSize: "12px",
        background: "#000000"
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#00ff88", // Bright green like your image
          downward: "#ff4757", // Bright red like your image
        },
        wick: {
          useFillColor: true,
        }
      },
    },
    stroke: {
      width: [1, 1, 1, 1], // Thin lines like professional charts
      curve: "smooth"
    },
    colors: [
      "#ffffff", // Candlesticks (white)
      "#ffa726", // MA5 (orange) - like your image
      "#42a5f5", // MA10 (blue) - like your image  
      "#ab47bc", // MA30 (purple) - like your image
    ],
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
      labels: {
        colors: "#888888"
      },
      markers: {
        width: 6,
        height: 6,
        strokeWidth: 0,
        radius: 3
      },
      itemMargin: {
        horizontal: 12,
        vertical: 4
      }
    },
  };

  return <Chart options={options} series={series} type="candlestick" height={350} />;
};

export default CryptoChart;
