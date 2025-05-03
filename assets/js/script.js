/* Background Black na navbar quando rolar */
document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.getElementById("mainNav");
  
    function updateNavbar() {
      if (window.scrollY > 950) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  
    window.addEventListener("scroll", updateNavbar);
    updateNavbar();
});


function nacaoBtn() {
    window.scrollTo({ top: 1000, behavior: 'smooth' }); 
}

//Rola até o Inicio
document.getElementById('scroll-btn-inicio').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
});


//Rola até a Comunidade
document.getElementById('scroll-btn-comunidade').addEventListener('click', () => {
    window.scrollTo({ top: 1000, behavior: 'smooth' });
});

//Rola até a Eventos
document.getElementById('scroll-btn-eventos').addEventListener('click', () => {
    window.scrollTo({ top: 1970, behavior: 'smooth' }); 
});

//Rola até a Loja
document.getElementById('scroll-btn-loja').addEventListener('click', () => {
    window.scrollTo({ top: 3575, behavior: 'smooth' });
});