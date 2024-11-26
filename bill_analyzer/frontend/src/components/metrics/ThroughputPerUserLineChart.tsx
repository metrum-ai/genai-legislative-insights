/* Created by Metrum AI for Dell */
// File: src/components/ThroughputPerUserLineChart.tsx
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

// Type definition for data point
type DataPoint = { name: string; value: number };

const VITE_REMOTE_IP = window.location.hostname;


// Fetch throughput data per user
const fetchThroughputData = async (jobs: number): Promise<number | null> => {
  try {
    const response = await fetch(
       `http://${VITE_REMOTE_IP}:8100/metrics/api/v1/query?query=sum(vllm:avg_generation_throughput_toks_per_s{instance=~"vllm_serving_0:8000|vllm_serving_1:8000"})/${jobs}`
    );
    const result = await response.json();
    if (result.status === "success") {
      return parseFloat(result.data.result[0].value[1]);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return null;
};

const renderLineChart = (
  selector: string,
  data: DataPoint[],
  width = 300,
  height = 160
) => {
  // Remove any existing chart before rendering new one
  d3.select(selector).select("svg").remove();

  const margin = { top: 10, right: 40, bottom: 20, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3
    .scalePoint()
    .domain(data.map((_, i) => i.toString()))
    .range([0, chartWidth]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) || 1])
    .nice()
    .range([chartHeight, 0]);

  // Define the line
  const line = d3
    .line<DataPoint>()
    .x((_, i) => x(i.toString()) as number)
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  // Define the area
  const area = d3
    .area<DataPoint>()
    .x((_, i) => x(i.toString()) as number)
    .y0(chartHeight)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  // Define the gradient
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient
    .append("stop")
    .attr("offset", "5%")
    .attr("stop-color", "#82ca9d")
    .attr("stop-opacity", 0.8);

  gradient
    .append("stop")
    .attr("offset", "95%")
    .attr("stop-color", "#82ca9d")
    .attr("stop-opacity", 0);

  // Add the area
  svg.append("path").datum(data).attr("fill", "url(#gradient)").attr("d", area);

  // Add the line path
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#82ca9d")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add x-axis with tick marks only
  svg
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(6)
        .tickFormat((): string => "")
    );

  // Add y-axis with min and max labels only
  svg
    .append("g")
    .call(d3.axisLeft(y).tickValues([0, d3.max(data, (d) => d.value) || 1]));

  // Add dots
  svg
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (_, i) => x(i.toString()) as number)
    .attr("cy", (d) => y(d.value))
    .attr("r", 4)
    .attr("fill", "#82ca9d");
};

const ThroughputPerUserLineChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DataPoint[]>([]);

  // Access jobs from Redux
  const jobs = useSelector((state: { user: { jobs: number } }) => state.user.jobs) || 1;

  useEffect(() => {
    const updateData = async () => {
      const newValue = await fetchThroughputData(jobs);
      if (newValue !== null) {
        setData((prevData) => {
          const updatedData = [...prevData, { name: "", value: newValue }];
          return updatedData.slice(-6); // Keep only the latest 6 points
        });
      }
    };

    updateData(); // Initial fetch
    const interval = setInterval(updateData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [jobs]);

  useEffect(() => {
    if (chartRef.current) {
      renderLineChart(
        chartRef.current ? `#${chartRef.current.id}` : "",
        data,
        240,
        130
      );
    }
  }, [data]);

  return <div ref={chartRef} id="throughput-per-user-line-chart"></div>;
};

export default ThroughputPerUserLineChart;
