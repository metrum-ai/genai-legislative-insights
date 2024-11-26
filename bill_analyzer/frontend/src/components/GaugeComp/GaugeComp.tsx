/* Created by Metrum AI for Dell */
import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface GaugeProps {
  value: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

const GaugeComp: React.FC<GaugeProps> = ({ value, canvasWidth = 200, canvasHeight = 150 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const needleRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();

  // Generate a unique ID once and persist it across renders
  const uniqueIdRef = useRef(
    `gauge-${Math.random().toString(36).substr(2, 9)}`
  );
  const uniqueId = uniqueIdRef.current;

  // Dimensions and configuration
  const chartWidth = 200;
  const chartHeight = 150; // Half of the width for a semicircle
  const innerRadius = 50;
  const outerRadius = 70;
  const numSections = 6;
  const colors = [
    "green",
    "yellowgreen",
    "yellow",
    "orange",
    "orangered",
    "red",
  ];

  useEffect(() => {
    if (!ref.current) return;

    // Initial rendering
    const svg = d3
      .select(ref.current)
      .attr("viewBox", `-25 25 ${chartWidth + 20} ${chartHeight + 20}`) // Adding extra space below the gauge for the text
      .attr("preserveAspectRatio", "xMidYMid meet"); // Preserve chart proportions

    // Adjusted Data for the arcs
    const arcData = d3.range(numSections).map((i) => ({
      startAngle: -Math.PI / 2 + (i * Math.PI) / numSections,
      endAngle: -Math.PI / 2 + ((i + 1) * Math.PI) / numSections,
    }));

    // Arc generator
    const arc = d3.arc<d3.DefaultArcObject>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    // Draw the arcs
    svg
      .append("g")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight})`)
      .selectAll("path")
      .data(arcData)
      .enter()
      .append("path")
      .attr("d", d => arc({
        ...d,
        innerRadius,
        outerRadius
      }))
      .attr("fill", (_d, i) => colors[i]);

    // Draw the needle
    const needleLength = outerRadius * 0.9;
    const needleWidth = 5;
    svg.selectAll(`#${uniqueId}-needle`).remove(); // Reference by unique ID
    const needle = svg
      .append("g")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight})`)
      .attr("id", `${uniqueId}-needle`);

    // Needle path
    const needleLine = d3.line<{ x: number, y: number }>()
      .x(d => d.x)
      .y(d => d.y);

    const needleData = [
      { x: 0, y: 0 },
      { x: -needleWidth, y: 0 },
      { x: 0, y: -needleLength },
      { x: needleWidth, y: 0 },
      { x: 0, y: 0 },
    ];

    needle
      .append("path")
      .attr("d", needleLine(needleData))
      .attr("fill", "black");

    // Add a circle at the center
    needle
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", "black");

    // Save needle reference for updates
    needleRef.current = needle;

    // Append a single text element for displaying the value
    svg
      .append("text")
      .attr("id", `${uniqueId}-value-text`)
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 25) // Position below the chart
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "black");
  }, []); // Run once on component mount
  useEffect(() => {
    // Normalize value to 0 - 100 scale
    const normalizedValue = (value / 2000) * 100;

    // Update the needle position when value changes
    const needle = needleRef.current;

    if (needle) {
      // Adjusted scale value to angle (from -90 to +90 degrees in radians)
      const valueScale = d3
        .scaleLinear()
        .domain([0, 100]) // Gauge value range
        .range([-Math.PI / 2, Math.PI / 2]);

      const angle = valueScale(normalizedValue);

      needle
        .transition()
        .duration(500)
        .attr(
          "transform",
          `translate(${chartWidth / 2}, ${chartHeight}) rotate(${(angle * 180) / Math.PI
          })`
        );
    }

    // Update the displayed value below the chart
    d3.select(`#${uniqueId}-value-text`).text(value);
  }, [value]); // Update when 'value' changes

  return (
    <svg
      ref={ref}
      style={{
        width: canvasWidth,
        height: canvasHeight,
      }}
    ></svg>
  );
};

export default GaugeComp;
