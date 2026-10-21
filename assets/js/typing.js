const typingElement = document.querySelector("#typing");

if (typingElement && window.portfolioContentPromise) {
  window.portfolioContentPromise.then((content) => {
    if (!content) return;
    const { hero } = content;
    const phrases = hero.phrases;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !phrases.length) {
      typingElement.textContent = phrases[0] || "";
      return;
    }

  let phraseIndex = 0;
  let characterIndex = phrases[0].length;
  let deleting = true;

  const typeNext = () => {
    const phrase = phrases[phraseIndex];
    characterIndex += deleting ? -1 : 1;
    typingElement.textContent = phrase.slice(0, characterIndex);

    if (characterIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      window.setTimeout(typeNext, 350);
      return;
    }

    if (characterIndex === phrases[phraseIndex].length) {
      deleting = true;
      window.setTimeout(typeNext, 1500);
      return;
    }

    window.setTimeout(typeNext, deleting ? 45 : 85);
  };

  window.setTimeout(typeNext, 1600);
  }).catch((error) => console.error("Could not load animated headline phrases.", error));
}
