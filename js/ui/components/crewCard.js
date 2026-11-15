import { t } from "../../app/i18n.js";
export function crewCard(member, crewData) {
  const element = document.createElement("article");
  const info = crewData.find((item) => item.id === member.id) || member;
  element.className = "crew-card";
  const avatar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  avatar.setAttribute("viewBox", "0 0 48 48");
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = `<circle cx="24" cy="24" r="22" fill="var(--panel-2)"/><circle cx="24" cy="18" r="8" fill="var(--mars)"/><path d="M10 42c2-12 26-12 28 0" fill="var(--air)"/>`;
  const details = document.createElement("div"); details.className = "crew-details";
  const text = document.createElement("strong"); text.textContent = t(info.nameKey || `crew.${member.id}.name`);
  const role = document.createElement("small"); role.textContent = t(info.roleKey || `crew.${member.id}.role`);
  const wellbeing = document.createElement("div"); wellbeing.className = "crew-wellbeing";
  const fill = document.createElement("span"); fill.style.width = `${member.wellbeing}%`; wellbeing.append(fill);
  const status = document.createElement("small"); status.textContent = `${t("ui.wellbeing")}: ${member.wellbeing}`;
  details.append(text, role, wellbeing, status); element.append(avatar, details);
  return element;
}
