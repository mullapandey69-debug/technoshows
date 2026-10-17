
document.addEventListener("keydown", function (e) {
  const key = e.key.toUpperCase();

  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey &&
      ["I", "J", "C"].includes(key))
  ) {
    window.location.replace("https://www.youtube.com/");
  }
});

