export function meter(label, value, max = 100) {
  const element = document.createElement("div"); element.className = "meter"; element.setAttribute("role", "meter"); element.setAttribute("aria-label", label); element.setAttribute("aria-valuenow", value); element.setAttribute("aria-valuemax", max);
  const heading = document.createElement("div"); heading.className = "meter-heading";
  const name = document.createElement("strong"); name.textContent = label;
  const number = document.createElement("span"); number.textContent = `${value}/${max}`;
  const track = document.createElement("div"); track.className = "meter-track";
  const fill = document.createElement("span"); fill.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  track.append(fill); heading.append(name, number); element.append(heading, track); return element;
}
