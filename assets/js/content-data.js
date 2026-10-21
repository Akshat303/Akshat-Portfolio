window.loadPortfolioData = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}: ${response.status} ${response.statusText}`);
  return response.json();
};

window.showPortfolioDataError = (container, error) => {
  console.error(error);
  const message = document.createElement("p");
  message.className = "portfolio-data-error";
  message.setAttribute("role", "alert");
  message.textContent = "This section could not load. Check that the JSON file is valid and refresh the page.";
  container.replaceChildren(message);
};
