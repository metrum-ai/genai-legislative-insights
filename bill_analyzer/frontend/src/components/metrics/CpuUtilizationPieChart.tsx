/* Created by Metrum AI for Dell */
/* eslint-disa
ble @typescript-eslint/no-explicit-any */
// File: src/components/CpuUtilizationPieChart.tsx
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


const CpuUtilizationPieChart: React.FC = () => {
  const ref = useRef<SVGSVGElement>(null);
  const [utilization, setUtilization] = useState(0);

  // Fetch data function
  const fetchData = async () => {
    try {
      const response = await fetch(
         `http://${VITE_REMOTE_IP}:8100/metrics/api/v1/query?query=100*(1-avg%20by(instance)(rate(node_cpu_seconds_total{mode=%22idle%22}[20s])))`
      );
      const result: ApiResponse = await response.json();
      if (result.status === "success") {
        const newValue = Math.ceil(parseFloat(result.data.result[0].value[1]));
        setUtilization(newValue);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  useEffect(() => {
    const width = 240;
    const height = 160;
    const radius = Math.min(width, height) / 2;
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 100])
      .range(["#8bc34a", "#1e88e5"]); // Gradient from light green to deep blue

    // Clear previous SVG content
    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create arcs for filled and remaining sections
    const filledArc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle((utilization / 100) * 2 * Math.PI);

    const remainingArc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)
      .startAngle((utilization / 100) * 2 * Math.PI)
      .endAngle(2 * Math.PI);

    // Draw filled arc with gradient based on utilization
    svg
      .append("path")
      .attr("d", filledArc as any)
      .attr("fill", colorScale(utilization));

    // Draw remaining arc in light grey
    svg
      .append("path")
      .attr("d", remainingArc as any)
      .attr("fill", "#e0e0e0");

    // Display utilization percentage in the center
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "24px")
      .style("fill", "#424242")
      .text(`${utilization}%`);
  }, [utilization]);

  return <svg ref={ref} width={200} height={160}></svg>;
};

export default CpuUtilizationPieChart;
