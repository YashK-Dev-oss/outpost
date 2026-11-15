import { t } from "../../app/i18n.js";
export function selectScreen({ onStart, initialMode = "full" }) {
  const section = document.createElement("section"); section.className = "screen select-screen";
  const h = document.createElement("h1"); h.textContent = t("ui.missionSelect"); section.append(h);
  const intro = document.createElement("p"); intro.className = "screen-intro"; intro.textContent = t("ui.nextStepChoose"); section.append(intro);
  const form = document.createElement("form");
  const nameLabel = document.createElement("label"); nameLabel.className = "field-label"; nameLabel.textContent = t("ui.name");
  const name = document.createElement("input"); name.placeholder = t("ui.nameHelp"); name.maxLength = 16; name.setAttribute("aria-label", t("ui.name")); nameLabel.append(name); form.append(nameLabel);
  const choices = document.createElement("div"); choices.className = "choice-grid";
  ["cadet", "astronaut", "commander"].forEach((difficulty, index) => {
    const label = document.createElement("label"); label.className = "choice-card";
    const radio = document.createElement("input"); radio.type = "radio"; radio.name = "difficulty"; radio.value = difficulty; radio.checked = initialMode === "training" ? difficulty === "cadet" : index === 1;
    const title = document.createElement("strong"); title.textContent = t(`ui.${difficulty}`);
    const help = document.createElement("small"); help.textContent = t(`ui.${difficulty}Help`);
    label.append(radio, title, help); choices.append(label);
  });
  form.append(choices); const classroom = document.createElement("label"); classroom.className = "classroom-choice"; const toggle = document.createElement("input"); toggle.type = "checkbox"; const classroomText = document.createElement("span"); classroomText.append(document.createElement("strong"), document.createElement("small")); classroomText.firstChild.textContent = t("ui.classroom"); classroomText.lastChild.textContent = t("ui.classroomHelp"); classroom.append(toggle, classroomText); form.append(classroom);
  const start = document.createElement("button"); start.className = "primary form-submit"; start.type = "submit"; start.textContent = t("ui.newMission"); form.append(start);
  if (initialMode === "training") { form.elements.difficulty.value = "cadet"; toggle.checked = false; }
  form.onsubmit = (event) => { event.preventDefault(); onStart({ difficulty: form.elements.difficulty.value, mode: initialMode === "training" ? "training" : toggle.checked ? "classroom" : "full", playerName: name.value }); };
  section.append(form); return section;
}
