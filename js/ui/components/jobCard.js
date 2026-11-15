import { t } from "../../app/i18n.js";
export function jobCard(job, onSelect) {
  const button = document.createElement("button"); button.type = "button"; button.textContent = `${job.icon} ${t(job.nameKey)}`; button.onclick = onSelect; return button;
}
