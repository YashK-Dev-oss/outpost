/** Render a small accessible SVG line chart from {sol, value} points. */
export function lineChart(points, label) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 360 120");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  svg.classList.add("line-chart");
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "var(--air)");
  path.setAttribute("stroke-width", "4");
  path.setAttribute("points", points.map((point, index) => {
    const x = points.length < 2 ? 180 : 12 + (index / (points.length - 1)) * 336;
    const y = 108 - ((point.value - min) / range) * 92;
    return `${x},${y}`;
  }).join(" "));
  svg.append(path);
  return svg;
}
