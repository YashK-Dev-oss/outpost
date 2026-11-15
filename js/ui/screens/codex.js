import { t } from "../../app/i18n.js";
import { badge } from "../components/badge.js";
export function codexScreen({ data, onBack }) {
  const section = document.createElement("section"); section.className = "screen";
  const h = document.createElement("h1"); h.textContent = t("ui.codex"); section.append(h);
  for (const entry of data.codex) {
    const article = document.createElement("article");
    const title = document.createElement("h2"); title.textContent = t(entry.titleKey); article.append(title);
    article.append(badge(entry.kind));
    const text = document.createElement("p"); text.textContent = t(entry.textKey); article.append(text);
    if (entry.sourceName) { const source = document.createElement("small"); source.textContent = t("ui.codexSource", { source: entry.sourceName }); article.append(source); }
    section.append(article);
  }
  const back = document.createElement("button"); back.textContent = t("ui.back"); back.onclick = onBack; section.append(back); return section;
}
