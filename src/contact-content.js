// Keep the template's typography, fields and motion, with honest Syren content.
export function applyContactContent(root) {
  const heading = [...root.querySelectorAll("h1")].find((node) => node.textContent.trim() === "Design your health.");
  if (!heading) return;
  const section = heading.closest("section");
  section.dataset.syrenContactPage = "true";
  const copy = new Map([
    ["Get started", "Get in touch"],
    ["Design your health.", "Let’s talk about care."],
    ["Connect with our wellness experts to explore how Luvia can build a personalized system based on your unique biological data.", "Work in senior care, support a family member, or have a question about Syren? We’d like to hear your perspective."],
    ["Luvia provided the high-fidelity foundation required for me to take full control of my long-term health.", "We’re developing room-based sensing around the realities of overnight care. Conversations with care teams help us understand what would be useful."],
    ["Alex Martin", "Syren Health"],
    ["Founder of Quora", "In development for senior care"],
    ["Where are you located?", "Your connection to care"],
    ["What is your primary objective?", "What would you like to discuss?"],
    ["Health Plan", "Areas of interest (optional)"],
    ["Full Lab Analysis", "Overnight care"],
    ["Biomarker Tracking", "Contactless sensing"],
    ["Longevity Coaching", "Caregiver workflows"],
    ["Custom Wellness Protocol", "Product feedback"],
    ["Request access", "Send inquiry"],
    ["By submitting, you agree to our terms of service.", "Your inquiry is processed by FormSubmit and emailed to Syren Health. Please don’t include resident or medical information."],
  ]);
  section.querySelectorAll("h1,p").forEach((node) => {
    const replacement = copy.get(node.textContent.trim());
    if (replacement) node.textContent = replacement;
  });
  section.querySelector('[data-framer-name="Stars"]')?.remove();
  const eyebrow = [...section.querySelectorAll("p")].find((node) => node.textContent === "Get in touch");
  eyebrow?.style.setProperty("--framer-text-color", "#696963");
  eyebrow?.parentElement.parentElement.querySelector("svg")?.style.setProperty("--21h8s6", "#696963");
  const form = section.querySelector("form");
  if (!form) return;
  form.dataset.syrenContact = "true";
  const note = [...form.querySelectorAll("p")].find((node) => node.textContent.startsWith("Your inquiry is processed"));
  if (note) {
    const email = root.createElement("a");
    email.href = "mailto:rishit020@gmail.com";
    email.textContent = " Or email rishit020@gmail.com.";
    email.className = "framer-text";
    note.append(email);
  }
  form.querySelector('button[type="submit"]')?.setAttribute("aria-label", "Send inquiry");
  const selects = [...form.querySelectorAll("select")];
  const choices = [
    ["Care-team member", "Senior-care operator", "Family member", "Researcher or partner", "Other"],
    ["Share care-team feedback", "Ask about the prototype", "Discuss a collaboration", "General question"],
  ];
  selects.forEach((select, index) => {
    select.name = index === 0 ? "Connection to care" : "Topic";
    select.replaceChildren();
    const placeholder = root.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select…";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.setAttribute("selected", "");
    select.append(placeholder);
    choices[index]?.forEach((label) => {
      const option = root.createElement("option");
      option.value = label;
      option.textContent = label;
      select.append(option);
    });
  });
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.name = input.closest("label")?.textContent.trim() || "Interest";
  });
  form.querySelectorAll('input[aria-hidden="true"]').forEach((input) => input.remove());
  const honey = root.createElement("input");
  honey.type = "text";
  honey.name = "_honey";
  honey.tabIndex = -1;
  honey.autocomplete = "off";
  honey.setAttribute("aria-hidden", "true");
  honey.style.cssText = "position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden";
  form.append(honey);
  form.querySelector('input[placeholder="Full name"]')?.setAttribute("maxlength", "100");
  form.querySelector('input[type="email"]')?.setAttribute("maxlength", "254");
  const messageLabel = form.querySelector('label[data-framer-name="Full name"]')?.cloneNode(true);
  if (messageLabel) {
    messageLabel.dataset.framerName = "Message";
    messageLabel.querySelector("p").textContent = "Your message (optional)";
    const input = messageLabel.querySelector("input");
    const message = root.createElement("textarea");
    message.name = "Message";
    message.placeholder = "Tell us what you’d like to discuss";
    message.rows = 4;
    message.maxLength = 3000;
    message.className = input.className;
    message.style.cssText = "height:120px;min-height:120px;resize:vertical";
    input.replaceWith(message);
    message.parentElement.style.height = "auto";
    const submit = form.querySelector('button[type="submit"]')?.closest(".ssr-variant");
    if (submit) form.insertBefore(messageLabel, submit);
  }
  form.querySelector('input[placeholder="Full name"]')?.setAttribute("autocomplete", "name");
  form.querySelector('input[type="email"]')?.setAttribute("autocomplete", "email");
}
