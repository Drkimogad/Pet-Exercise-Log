"use strict";

const AppHelper = (function() {
  // Cache DOM references
  const appContainer = document.getElementById('app');
  const components = {};

  function showPage(pageHTML) {
    appContainer.innerHTML = pageHTML;
  }

  // New component management system
  function renderComponent(componentId, html) {
    const target = document.getElementById(componentId);
    if (target) {
      target.innerHTML = html;
      return true;
    }
    return false;
  }

  // Dynamic section updater
  function updateSection(sectionId, content) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.innerHTML = content;
      return true;
    }
    return false;
  }

  // Component registration system
  function registerComponent(id, renderCallback) {
    components[id] = renderCallback;
  }

  // Refresh specific component
  function refreshComponent(id) {
    if (components[id]) {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = components[id]();
      }
    }
  }

  return {
    showPage,
    renderComponent,
    updateSection,
    registerComponent,
    refreshComponent
  };
})();
