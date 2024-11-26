/* Created by Metrum AI for Dell */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";

// Type for the API response value
type ApiResponse = {
  status: string;
  data: {
    result: Array<{
      value: [number, string];
    }>;
  };
};

const VITE_REMOTE_IP = window.location.hostname;


const ServerPowerGauge: React.FC = () => {
  const ref = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement | null>(null);
  const uniqueId = useRef(
    `gauge-${Math.random().toString(36).substr(2, 9)}`
  ).current;

  const chartWidth = 300;
  const chartHeight = 160;
  const innerRadius = 60;
  const outerRadius = 120;
  const numSections = 1000;

  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1000); // Track the maximum value dynamically

  // Fetch data function
  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://${VITE_REMOTE_IP}:8100/metrics/api/v1/query?query=avg_over_time(ipmi_power_watts[10s])`
      );
      const result: ApiResponse = await response.json();
      if (result.status === "success") {
        const newValue = parseFloat(result.data.result[0].value[1]);
        setValue(newValue);
        if (newValue > maxValue) setMaxValue(newValue); // Update maxValue if newValue exceeds it
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [maxValue]);

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${chartWidth} ${chartHeight + 40}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const arcData = d3.range(numSections).map((i) => ({
      startAngle: -Math.PI / 2 + (i * Math.PI) / numSections,
      endAngle: -Math.PI / 2 + ((i + 1) * Math.PI) / numSections,
    }));

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    // Define pastel color scale from soft green to soft blue
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, numSections - 1])
      .range(["#89D8A8", "#1081E4"]); // Soft green to pastel blue

    // Draw colored sections with gradient effect
    svg
      .append("g")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight})`)
      .selectAll("path")
      .data(arcData)
      .enter()
      .append("path")
      .attr("d", arc as any)
      .attr("fill", (_, i) => colorScale(i));

    const needleLength = outerRadius * 0.9;
    const needleWidth = 5;
    const needleGroup = svg
      .append("g")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight})`)
      .attr("id", `${uniqueId}-needle`);
    needleRef.current = needleGroup.node();

    // Draw needle
    const needleData = [
      { x: 0, y: 0 },
      { x: -needleWidth, y: 0 },
      { x: 0, y: -needleLength },
      { x: needleWidth, y: 0 },
      { x: 0, y: 0 },
    ];
    const needleLine = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y);
    needleGroup
      .append("path")
      .attr("d", needleLine(needleData) as string)
      .attr("fill", "black");
    needleGroup
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", "black");

    // Text displaying the value
    svg
      .append("text")
      .attr("id", `${uniqueId}-value-text`)
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "black");
  }, []);

  useEffect(() => {
    const needle = d3.select(needleRef.current);
    const valueScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([-Math.PI / 2, Math.PI / 2]);
    const angle = valueScale(value);

    needle
      .transition()
      .duration(500)
      .attr(
        "transform",
        `translate(${chartWidth / 2}, ${chartHeight}) rotate(${(angle * 180) / Math.PI
        })`
      );

    d3.select(`#${uniqueId}-value-text`).text(`${value}`);
  }, [value, maxValue]);

  return <svg ref={ref} width={240} height={160}></svg>;
};

export default ServerPowerGauge;
