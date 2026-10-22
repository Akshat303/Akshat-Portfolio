const badgeGrid = document.querySelector("#badge-grid");
const certificateGrid = document.querySelector("#certificate-grid");

function createBadge(badge) {
  const card = document.createElement("article");
  card.className = "badge-card";
  const symbol = document.createElement("span");
  symbol.className = `badge-symbol ${badge.style}`;
  symbol.textContent = badge.symbol;
  const name = document.createElement("h3");
  name.textContent = badge.name;
  const description = document.createElement("p");
  description.textContent = badge.description;
  card.append(symbol, name, description);
  return card;
}

function createCertificate(certificate) {
  const card = document.createElement("a");
  card.className = "certificate-card";
  card.href = certificate.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  const preview = document.createElement("span");
  preview.className = "certificate-preview";
  const image = document.createElement("img");
  image.src = "../assets/images/certificate-preview.svg";
  image.alt = "";
  image.className = certificate.image ? "certificate-image-real" : "certificate-image-placeholder";
  const fallbackImage = image.src;
  image.addEventListener("error", () => { image.src = fallbackImage; }, { once: true });
  if (certificate.image) image.src = certificate.image;
  const shortName = document.createElement("span");
  shortName.textContent = certificate.shortName;
  preview.append(image, shortName);
  const info = document.createElement("span");
  info.className = "certificate-info";
  const name = document.createElement("strong");
  name.textContent = certificate.name;
  const provider = document.createElement("small");
  provider.textContent = certificate.provider;
  info.append(name, provider);
  const verified = document.createElement("span");
  verified.className = "verified-badge";
  verified.textContent = window.portfolioContent.achievementsPage.verifiedLabel;
  const arrow = document.createElement("span");
  arrow.className = "certificate-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  card.append(preview, info, verified, arrow);
  return card;
}

Promise.all([
  window.loadPortfolioData("../assets/data/achievements.json"),
  window.portfolioContentPromise
])
  .then(([data, site]) => {
    if (!site) throw new Error("Site content is unavailable; check assets/data/site-content.json.");
    window.portfolioContent = site;
    badgeGrid.replaceChildren(...data.badges.map(createBadge));
    certificateGrid.replaceChildren(...data.certificates.map(createCertificate));
    document.querySelector("#hackerRank-profile-link").href = data.profileUrl;
    document.querySelector("#badge-count").textContent = `${data.badges.length} ${site.achievementsPage.badgeCountLabel}`;
    document.querySelector("#certificate-count").textContent = `${data.certificates.length} ${site.achievementsPage.certificateCountLabel}`;
  })
  .catch((error) => {
    window.showPortfolioDataError(badgeGrid, error);
    window.showPortfolioDataError(certificateGrid, error);
  });
