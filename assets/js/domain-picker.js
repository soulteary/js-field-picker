window.DomainPicker = (function () {
  var DomainPicker = {
    Show: showPicker,
    Hide: hidePicker,
    GetSelected: function () {
      return this.Selected;
    },

    options: {},
    Selected: null,
    Domain: null,
    ComponentId: "",
    onChange: null,
  };

  function getRootDomain(datasets) {
    const [rootInfo] = datasets;
    const { cname, code } = rootInfo;
    const allChildrenChecked = datasets.every((dataset) => dataset.checked);
    const state = allChildrenChecked ? "checked" : "";

    return `
      <div class="flex flex-row justify-between">
        <div class="domain-picker-title">${cname}</div>
        <div>
          <label for="domain-${code}" class="domain-checkBox checkBox-inner">
            <input id="domain-${code}" type="checkbox" name="domain-${code}" value="${code}" ${state}>
            <span class="checkBox"></span>
          </label>
        </div>
      </div>
    `;
  }

  function getSingleDomain(dataset) {
    const { name, cname, code, checked, link, children } = dataset;
    const state = checked ? "checked" : "";
    let content = `
      <div class="flex flex-row justify-between">
        <div class="domain-picker-title">${cname}</div>
        <div>
          <label for="domain-${code}" class="domain-checkBox checkBox-inner">
            <input id="domain-${code}" type="checkbox" name="domain-${code}" value="${code}" ${state}>
            <span class="checkBox"></span>
          </label>
        </div>
      </div>
    `;

    if (children && children.length) {
      const allChildrenChecked = children.every((child) => child.checked);
      const indeterminateState = !allChildrenChecked && children.some((child) => child.checked);

      content = `
        <div class="flex flex-row justify-between">
          <div class="flex flex-row">
            <div class="domain-picker-append">-</div>
            <div class="domain-picker-title">${cname}</div>
          </div>
          <div>
            <label for="domain-${code}" class="domain-checkBox checkBox-inner">
              <input id="domain-${code}" type="checkbox" name="domain-${code}" value="${code}" ${state}>
              <span class="checkBox ${indeterminateState ? "is-indeterminate" : ""}"></span>
            </label>
          </div>
        </div>
        ${getSingleDomainChildren(children)}
      `;
    }

    return `
      <div class="domain-picker-item">
        ${content}
      </div>
    `;
  }

  function getSingleDomainChildren(dataset) {
    if (!dataset || !dataset.length) {
      return "";
    }

    return `
      <div class="domain-picker-item-children">
        ${dataset.map((item) => getSingleDomain(item)).join("")}
      </div>
    `;
  }

  function initBaseContainer(container, componentId) {
    const template = `
      <div id="${componentId}" class="picker-box domain-picker">
        <div class="domain-picker-item">
          ${getRootDomain(DomainOptions.data)}
          <div class="domain-picker-item-children">
            ${DomainOptions.data
              .slice(1)
              .map((dataset) => getSingleDomain(dataset))
              .join("")}
          </div>
        </div>
      </div>
    `;

    document.querySelector(container).innerHTML = template;

    bindAppendEvents(container);
    bindCheckboxEvents(container);
  }

  /**
   * Attach event listeners to domain append +/-
   */
  function bindAppendEvents(container) {
    const appendIcons = document.querySelectorAll(`${container} .domain-picker-append`);
    appendIcons.forEach((icon) => {
      icon.addEventListener("click", function () {
        const children = this.closest(".domain-picker-item").querySelector(".domain-picker-item-children");
        const isHidden = children.classList.contains("hide");
        if (isHidden) {
          children.classList.remove("hide");
          this.textContent = "-";
        } else {
          children.classList.add("hide");
          this.textContent = "+";
        }
      });
    });

    updatePickerMaxHeight(container);
  }

  /**
   * checkbox bind event
   */
  function bindCheckboxEvents(container) {
    const domainAll = document.querySelector("#domain-all");
    domainAll.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(`${container} input[type=checkbox]`);
      checkboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      const checkBoxes = document.querySelectorAll(`${container} .checkBox`);
      checkBoxes.forEach((checkBox) => {
        checkBox.classList.remove("is-indeterminate");
      });
    });

    const domainCheckBoxes = document.querySelectorAll(`${container} .domain-checkBox input[type=checkbox]`);
    domainCheckBoxes.forEach((checkbox) => {
      checkbox.addEventListener("click", handleCheckboxClick);
      updateParentCheckboxState(checkbox);
    });
  }

  /**
   * Update the max-height of the domain picker based on the expanded content
   * @param {*} container
   */
  function updatePickerMaxHeight(container) {
    const picker = document.querySelector(`${container} .domain-picker`);
    const expandedContent = picker.querySelector(".domain-picker-item-children");
    const expandedContentHeight = expandedContent.offsetHeight;
    const pickerPadding = 24;
    const pickerMaxHeight = expandedContentHeight + pickerPadding;
    picker.style.maxHeight = pickerMaxHeight + "px";
  }

  /**
   * Update the parent checkboxes based on the initial selection of children
   * @param {*} checkbox
   */
  function updateParentCheckboxState(checkbox) {
    const parentItem = checkbox.closest(".domain-picker-item");
    const parentCheckboxWrapper = parentItem.parentNode.parentNode.querySelector(".checkBox");
    const siblings = parentItem.parentNode.querySelectorAll(".domain-picker-item");
    const checkedSiblings = parentItem.parentNode.querySelectorAll(".domain-picker-item input[type=checkbox]:checked");

    if (siblings.length > 1) {
      if (checkedSiblings.length === siblings.length) {
        parentCheckboxWrapper.classList.remove("is-indeterminate");
        parentCheckboxWrapper.classList.add("checked");
      } else if (checkedSiblings.length > 0) {
        parentCheckboxWrapper.classList.add("is-indeterminate");
        parentCheckboxWrapper.classList.remove("checked");
      } else {
        parentCheckboxWrapper.classList.remove("is-indeterminate");
        parentCheckboxWrapper.classList.remove("checked");
      }
    }

    const parentPicker = parentItem.parentNode.parentNode.closest(".domain-picker-item");
    if (parentPicker) {
      const parentCheckbox = parentPicker.querySelector("input[type=checkbox]");
      updateParentCheckboxState(parentCheckbox);
    }

    updateParentState(checkbox);
  }

  /**
   * Function to handle checkbox events
   * @param {*} event
   */
  function handleCheckboxClick(event) {
    const isChecked = event.target.checked;
    const currentPicker = event.target.closest(".domain-picker-item");
    const childrenPicker = currentPicker.querySelector(".domain-picker-item-children");

    toggleChildrenCheckboxes(childrenPicker, isChecked);

    // Update DomainPicker.Selected
    const domainId = event.target.value;
    if (isChecked) {
      DomainPicker.Selected.push(domainId);
    } else {
      const index = DomainPicker.Selected.indexOf(domainId);
      if (index !== -1) {
        DomainPicker.Selected.splice(index, 1);
      }
    }

    updateParentCheckboxState(event.target);

    if (DomainPicker && DomainPicker.options && DomainPicker.options.updater && typeof DomainPicker.options.updater === "function") {
      DomainPicker.options.updater(DomainPicker.Selected);
    }

    // Call the onChange callback
    if (DomainPicker.onChange && typeof DomainPicker.onChange === "function") {
      DomainPicker.onChange(DomainPicker.Selected);
    }
  }

  /**
   * Function to toggle the state of children checkboxes
   * @param {*} childrenPicker
   * @param {*} isChecked
   */
  function toggleChildrenCheckboxes(childrenPicker, isChecked) {
    if (childrenPicker) {
      const childCheckboxes = childrenPicker.querySelectorAll("input[type=checkbox]");
      childCheckboxes.forEach((childCheckbox) => {
        childCheckbox.checked = isChecked;

        // Update DomainPicker.Selected
        const domainId = childCheckbox.value;
        if (isChecked) {
          DomainPicker.Selected.push(domainId);
        } else {
          const index = DomainPicker.Selected.indexOf(domainId);
          if (index !== -1) {
            DomainPicker.Selected.splice(index, 1);
          }
        }
      });
    }
  }

  /**
   * Function to update the state of the parent checkbox
   * @param {*} parentCheckbox
   * @param {*} currentPicker
   */
  function updateParentState(checkbox) {
    const parentItem = checkbox.closest(".domain-picker-item-children");
    if (parentItem) {
      const parentCheckbox = parentItem.previousElementSibling.querySelector("input[type=checkbox]");
      const siblings = parentItem.querySelectorAll(".domain-picker-item");
      const checkedSiblings = parentItem.querySelectorAll(".domain-picker-item input[type=checkbox]:checked");

      if (checkedSiblings.length === siblings.length) {
        parentCheckbox.checked = true;
        parentCheckbox.classList.remove("is-indeterminate");
      } else if (checkedSiblings.length > 0) {
        parentCheckbox.checked = false;
        parentCheckbox.classList.add("is-indeterminate");
      } else {
        parentCheckbox.checked = false;
        parentCheckbox.classList.remove("is-indeterminate");
      }

      updateParentState(parentCheckbox);
    }
  }

  /**
   * Show the domain picker
   */
  function showPicker() {
    document.getElementById(DomainPicker.ComponentId).classList.remove("hide");
  }

  /**
   * Hide the domain picker
   */
  function hidePicker() {
    document.getElementById(DomainPicker.ComponentId).classList.add("hide");
  }

  function bootstrap(container, options) {
    const { datasets } = options;
    const componentId = "domain-picker-" + Math.random().toString(36).slice(-6);
    DomainPicker.ComponentId = componentId;
    DomainPicker.options = options;
    DomainPicker.Domain = datasets;
    DomainPicker.Selected = [];
    initBaseContainer(container, componentId);

    const checkboxes = document.querySelectorAll(`${container} input[type=checkbox]:checked`);
    checkboxes.forEach((checkbox) => {
      DomainPicker.Selected.push(checkbox.value);
    });

    return DomainPicker;
  }

  return bootstrap;
})();
