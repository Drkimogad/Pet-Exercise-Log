"use strict";

const AppHelper = (function() {
  function showPage(pageHTML) {
    document.getElementById('app').innerHTML = pageHTML;
  }

  return { showPage };
})();
