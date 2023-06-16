window.DomainPicker = (function () {
  var DomainPicker = {
    Selected: null,
    Domain: null,
    ComponentId: "",
    Show: showPicker,
    Hide: hidePicker,
  };

  function getRootDomain(datasets) {
    const [rootInfo] = datasets;
    const { cname, code } = rootInfo;
    return `
<div class="flex flex-row justify-between">
  <div class="domain-picker-title">${cname}</div>
  <div>
    <label for="domain-${code}" class="domain-checkBox checkBox-inner">
      <input id="domain-${code}" type="checkbox" name="domain-${code}" value="${code}">
      <span class="checkBox is-indeterminate"></span>
    </label>
  </div>
</div>
      `;
  }

  function getSingleDomain(dataset) {
    const { name, cname, code, checked, link, children } = dataset;
    const state = checked ? "checked" : "";
    return `
<div class="domain-picker-item">
  <div class="flex flex-row justify-between">
      <div class="flex flex-row">
          <div class="domain-picker-append">${children && children.length ? "+" : ""}</div>
          <div class="domain-picker-title">${cname}</div>
      </div>
      <div>
          <label for="domain-${code}" class="domain-checkBox checkBox-inner">
              <input id="domain-${code}" type="checkbox" name="domain-${code}" value="${code}" ${state} />
              <span class="checkBox"></span>
          </label>
      </div>
  </div>
  ${getSingleDomainChildren(children)}
</div>
`;
  }

  function getSingleDomainChildren(dataset) {
    if (!dataset || !dataset.length) {
      return "";
    }

    return `
<div class="domain-picker-item-children hide">

${dataset.map((item) => getSingleDomain(item)).join("")}

</div>
      `;
  }

  function initBaseContainer(container, componentId) {
    const template = `
<div id="${componentId}" class="picker-box domain-picker hide">
  <div class="domain-picker-item">
    ${getRootDomain(DomainPicker.Domain)}
    <div class="domain-picker-item-children">

    ${DomainPicker.Domain.slice(1)
      .map((dataset) => getSingleDomain(dataset))
      .join("")}

    </div>
  </div>
</div>
`;
    document.querySelector(container).innerHTML = template;
  }

  /**
   * Show the region picker
   */
  function showPicker() {
    document.getElementById(DomainPicker.ComponentId).classList.remove("hide");
  }

  /**
   * Hide the region picker
   */
  function hidePicker() {
    document.getElementById(DomainPicker.ComponentId).classList.add("hide");
  }

  function bootstrap(container, datasets) {
    const componentId = "domain-picker-" + Math.random().toString(36).slice(-6);
    DomainPicker.ComponentId = componentId;
    DomainPicker.Domain = datasets;
    initBaseContainer(container, componentId);

    return DomainPicker;
  }

  return bootstrap;
})();
