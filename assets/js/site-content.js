function getContentValue(data, path) {
  return path.split(".").reduce((value, key) => value?.[key], data);
}

const contentPath = document.body.dataset.contentPath || "assets/data/site-content.json";
window.portfolioContentPromise = window.loadPortfolioData(contentPath)
  .then((data) => {
    document.querySelectorAll("[data-content]").forEach((element) => {
      const value = getContentValue(data, element.dataset.content);
      if (value === undefined || value === null || typeof value === "object") {
        throw new Error(`Invalid site content value: ${element.dataset.content}`);
      }
      element.textContent = String(value);
    });

    document.querySelectorAll("[data-content-attr]").forEach((element) => {
      const value = getContentValue(data, element.dataset.contentAttr);
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Invalid site content attribute: ${element.dataset.contentAttr}`);
      }
      element.setAttribute(element.dataset.contentAttribute || "href", value);
    });

    document.querySelectorAll("[data-content-label]").forEach((element) => {
      const value = getContentValue(data, element.dataset.contentLabel);
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Invalid site content label: ${element.dataset.contentLabel}`);
      }
      element.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-content-meta]").forEach((element) => {
      const value = getContentValue(data, element.dataset.contentMeta);
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Invalid site metadata value: ${element.dataset.contentMeta}`);
      }
      element.setAttribute("content", value);
    });

    document.querySelectorAll("[data-content-title]").forEach((element) => {
      const value = getContentValue(data, element.dataset.contentTitle);
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Invalid site title value: ${element.dataset.contentTitle}`);
      }
      document.title = value;
    });

    const whatsapp = document.querySelector("#whatsapp-link");
    if (whatsapp) {
      const number = data.contact.whatsappNumber;
      if (!/^\d{8,15}$/.test(number)) {
        throw new Error("WhatsApp number must contain 8–15 digits, including country code.");
      }
      whatsapp.href = `https://wa.me/${number}?text=${encodeURIComponent(data.contact.whatsappMessage)}`;
    }

    window.portfolioContent = data;
    return data;
  })
  .catch((error) => {
    console.error(error);
    const main = document.querySelector("main");
    if (main) {
      const message = document.createElement("p");
      message.className = "portfolio-data-error";
      message.setAttribute("role", "alert");
      message.textContent = `Site content could not load. Check ${contentPath} and refresh the page.`;
      main.prepend(message);
    }
    return null;
  });
