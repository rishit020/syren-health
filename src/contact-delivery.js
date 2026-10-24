export const contactEndpoint = "https://formsubmit.co/ajax/rishit020@gmail.com";

export function contactPayload(form) {
  const fields = new FormData(form);
  return {
    name: String(fields.get("Full name") || "").trim(),
    email: String(fields.get("Email") || "").trim(),
    "Connection to care": String(fields.get("Connection to care") || ""),
    Topic: String(fields.get("Topic") || ""),
    Interests: [...form.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.name).join(", ") || "Not specified",
    message: String(fields.get("Message") || "").trim(),
    _honey: String(fields.get("_honey") || ""),
    _subject: "Syren Health — website inquiry",
    _template: "table",
  };
}

export async function deliverContact(payload, { fetcher = fetch, timeout = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetcher(contactEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: "omit",
    });
    const data = await response.json();
    const activation = /activat|confirm (?:your |the )?email/i.test(String(data.message || ""));
    if (activation) return { activation: true };
    if (!response.ok || (data.success !== true && data.success !== "true")) {
      throw new Error("The submission was not accepted.");
    }
    return { activation: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function submitContact(form, syncState) {
  if (form.dataset.sending === "true") return;
  const payload = contactPayload(form);
  // Bots that fill the offscreen field must not generate a request.
  if (payload._honey) return;
  let status = form.querySelector('[role="status"], [role="alert"]');
  if (!status) {
    status = document.createElement("div");
    status.className = "local-form-status";
    form.append(status);
  }
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const button = form.querySelector('button[type="submit"]');
  form.dataset.sending = "true";
  form.setAttribute("aria-busy", "true");
  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
  button.setAttribute("aria-label", "Sending inquiry");
  button.querySelectorAll("p").forEach((node) => { node.textContent = "Sending…"; });
  status.textContent = "Sending your inquiry…";
  try {
    const result = await deliverContact(payload);
    if (result.activation) {
      status.textContent = "Email delivery is awaiting activation. Please email rishit020@gmail.com directly for now.";
    } else {
      status.textContent = "Thank you—your inquiry has been submitted. We’ll reply to the email address you provided.";
      form.reset();
    }
  } catch {
    status.setAttribute("role", "alert");
    status.setAttribute("aria-live", "assertive");
    status.textContent = "We couldn’t confirm your submission. Your details are still here. Please try again or email rishit020@gmail.com directly.";
  } finally {
    delete form.dataset.sending;
    form.removeAttribute("aria-busy");
    button.disabled = false;
    button.setAttribute("aria-label", "Send inquiry");
    button.querySelectorAll("p").forEach((node) => { node.textContent = "Send inquiry"; });
    syncState(form);
    if (form.isConnected) status.scrollIntoView({ block: "nearest", behavior: "auto" });
  }
}
