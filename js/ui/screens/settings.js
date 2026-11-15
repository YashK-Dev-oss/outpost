import { t } from "../../app/i18n.js";
import { loadSettings, saveSettings } from "../../app/settings.js";
import { speechAvailable } from "../../app/speech.js";
import { clearSave } from "../../app/save.js";
import { startMusic, stopMusic } from "../../app/audio.js";

export function settingsScreen({ onBack }) {
  const section = document.createElement("section");
  section.className = "screen settings-screen";
  const heading = document.createElement("h1");
  heading.textContent = t("ui.settings");
  section.append(heading);
  const settings = loadSettings();
  const sizeLabel = document.createElement("label");
  sizeLabel.textContent = t("ui.textSize");
  const sizes = document.createElement("select");
  [["s", "S"], ["m", "M"], ["l", "L"]].forEach(([value, text]) => sizes.append(new Option(text, value)));
  sizes.value = settings.textSize;
  sizes.onchange = () => saveSettings({ textSize: sizes.value });
  sizeLabel.append(sizes);
  section.append(sizeLabel);
  [["contrast", "ui.highContrast"], ["reduceMotion", "ui.reduceMotion"], ["sound", "ui.sound"], ["music", "ui.music"], ["autoReadAloud", "ui.autoRead"], ["coachTips", "ui.coachTips"]].forEach(([key, labelKey]) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settings[key];
    input.disabled = key === "autoReadAloud" && !speechAvailable();
    input.onchange = () => {
      saveSettings({ [key]: input.checked });
      if (key === "music") {
        if (input.checked) startMusic(true);
        else stopMusic();
      }
    };
    label.append(input, document.createTextNode(t(labelKey)));
    section.append(label);
  });
    const reset = document.createElement("button");
    reset.textContent = t("ui.resetSave");
    reset.onclick = () => {
      if (window.confirm(t("ui.resetConfirm"))) clearSave();
    };
    section.append(reset);
  const back = document.createElement("button");
  back.textContent = t("ui.back");
  back.onclick = onBack;
  section.append(back);
  return section;
}
