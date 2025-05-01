document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("mainNav");

  function updateNavbar() {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", updateNavbar);
  updateNavbar();
});
