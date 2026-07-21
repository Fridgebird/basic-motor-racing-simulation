(function () {
  var topbar = document.getElementById('topbar');
  var nav = topbar && topbar.querySelector('.topbar-nav');
  if (!topbar || !nav) return;

  var burger = document.createElement('button');
  burger.id = 'topnav-burger';
  burger.textContent = '☰';
  burger.setAttribute('aria-label', 'Navigation menu');

  // Insert burger after the nav element — CSS hides nav and shows burger at ≤640px
  nav.parentNode.insertBefore(burger, nav.nextSibling);

  burger.addEventListener('click', function (e) {
    e.stopPropagation();
    nav.classList.toggle('topnav-open');
  });

  document.addEventListener('click', function () {
    nav.classList.remove('topnav-open');
  });
})();
