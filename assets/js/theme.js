const themeToggle = document.querySelector(".theme-toggle");

if (themeToggle) {
  const savedTheme = window.localStorage.getItem("portfolio-theme");
  if (savedTheme === "dark") document.body.classList.add("dark-theme");

  const updateThemeLabel = () => {
    const isDark = document.body.classList.contains("dark-theme");
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  };

  updateThemeLabel();
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const theme = document.body.classList.contains("dark-theme") ? "dark" : "light";
    window.localStorage.setItem("portfolio-theme", theme);
    updateThemeLabel();
  });
}
