window.DomainPicker = (function () {
  var DomainPicker = {
    Selected: null,
    Domain: null,
    ComponentId: "",
    domainTagsDom: [],
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
            <span class="checkBox"></span>
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
            <div class="domain-picker-append">${children && children.length ? "-" : "+"}</div>
            <div class="domain-picker-title">${cname}</div>
          </div>
          <div>
            <label for="domain-${code}" class="domain-checkBox checkBox-inner">
              <input id="domain-${code}" type="checkbox" name="domain-${code}" value="${code}" ${state}>
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
      <div class="domain-picker-item-children">
        ${dataset.map(item => getSingleDomain(item)).join("")}
      </div>
    `;
  }

  function initBaseContainer(container, componentId) {
    const template = `
      <div id="domainTags" class="topbar-text">
        <span></span>
      </div>
      <div id="${componentId}" class="picker-box domain-picker">
        <div class="domain-picker-item">
          ${getRootDomain(DomainOptions.data)}
          <div class="domain-picker-item-children">
            ${DomainOptions.data
              .slice(1)
              .map(dataset => getSingleDomain(dataset))
              .join("")}
          </div>
        </div>
      </div>
    `;

    document.querySelector(container).innerHTML = template;

    bindAppendEvents(container);
    bindCheckboxEvents(container);
    initializeDomainTags();
  }

  /**
   * Attach event listeners to domain append +/-
   */
  function bindAppendEvents(container) {
    const appendIcons = document.querySelectorAll(`${container} .domain-picker-append`);
    appendIcons.forEach(icon => {
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
      checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
      const checkBoxes = document.querySelectorAll(`${container} .checkBox`);
      checkBoxes.forEach(checkBox => {
        checkBox.classList.remove("is-indeterminate");
      });

      if (!this.checked) {
        DomainPicker.domainTagsDom = [];
        updateDomainTagsContainer();
      }
    });

    const domainCheckBoxes = document.querySelectorAll(`${container} .domain-checkBox input[type=checkbox]`);
    domainCheckBoxes.forEach(checkbox => {
      checkbox.addEventListener("click", handleCheckboxClick);
    });
  }

  /**
   * initialize the domainTags
   */
  function initializeDomainTags() {
    const checkboxes = document.querySelectorAll(`#${DomainPicker.ComponentId} input[type=checkbox]:checked`);
    checkboxes.forEach(checkbox => {
      const currentPicker = checkbox.closest(".domain-picker-item");
      const parentPicker = currentPicker.parentNode.previousElementSibling;
      const currentTitleElement = currentPicker.querySelector(".domain-picker-title");
      const parentTitleElement = parentPicker.querySelector(".domain-picker-title");
      const currentText = currentTitleElement ? currentTitleElement.textContent : "";
      const parentText = parentTitleElement ? parentTitleElement.textContent : "";

      updateDomainTags(currentText, parentText, true);
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
    const pickerPadding = 24; // Adjust this value according to your padding
    const pickerMaxHeight = expandedContentHeight + pickerPadding;
    picker.style.maxHeight = pickerMaxHeight + "px";
  }


  /**
   * Update the parent checkboxes based on the initial selection of children
   * @param {*} container 
   */
  function updateParentCheckboxes(container) {
    const parentItems = document.querySelectorAll(`${container} .domain-picker-item`);
    parentItems.forEach(parentItem => {
      const childCheckboxes = parentItem.querySelectorAll(".domain-picker-item-children input[type=checkbox]");
      const parentCheckbox = parentItem.querySelector("input[type=checkbox]");

      if (childCheckboxes.length === 0) return;

      const checkedChildCount = Array.from(childCheckboxes).filter(checkbox => checkbox.checked).length;
      const isFullySelected = checkedChildCount === childCheckboxes.length;

      parentCheckbox.checked = isFullySelected;
      const parentCheckboxWrapper = parentCheckbox.parentNode.querySelector(".checkBox");
      const siblings = parentCheckbox.closest(".domain-picker-item-children").querySelectorAll(".domain-picker-item");
      const checkedSiblings = parentCheckbox.closest(".domain-picker-item-children").querySelectorAll(".domain-picker-item input[type=checkbox]:checked");

      if (checkedSiblings.length === siblings.length) {
        parentCheckboxWrapper.classList.remove("is-indeterminate");
      } else if (checkedSiblings.length === 0) {
        parentCheckboxWrapper.classList.remove("is-indeterminate");
      } else {
        parentCheckboxWrapper.classList.add("is-indeterminate");
      }
    });
  }

  /**
   * Function to handle checkbox events
   * @param {*} event
   */
  function handleCheckboxClick(event) {
    const isChecked = event.target.checked;
    const currentPicker = event.target.closest(".domain-picker-item");
    const childrenPicker = currentPicker.querySelector(".domain-picker-item-children");
    const parentPicker = currentPicker.parentNode.previousElementSibling;
    const parentCheckbox = parentPicker.querySelector("input[type=checkbox]");
    const currentTitleElement = currentPicker.querySelector(".domain-picker-title");
    const parentTitleElement = parentPicker.querySelector(".domain-picker-title");
    const currentText = currentTitleElement ? currentTitleElement.textContent : "";
    const parentText = parentTitleElement ? parentTitleElement.textContent : "";

    toggleChildrenCheckboxes(childrenPicker, isChecked);
    updateParentCheckbox(parentCheckbox, currentPicker);
    updateDomainTags(currentText, parentText, isChecked);
  }

  /**
   * Function to toggle the state of children checkboxes
   * @param {*} childrenPicker
   * @param {*} isChecked
   */
  function toggleChildrenCheckboxes(childrenPicker, isChecked) {
    if (childrenPicker) {
      const childCheckboxes = childrenPicker.querySelectorAll("input[type=checkbox]");
      childCheckboxes.forEach(childCheckbox => {
        childCheckbox.checked = isChecked;
      });
    }
  }

  /**
   * Function to update the state of the parent checkbox
   * @param {*} parentCheckbox
   * @param {*} currentPicker
   */
  function updateParentCheckbox(parentCheckbox, currentPicker) {
    if (!parentCheckbox) return;
    const siblings = currentPicker.parentNode.querySelectorAll(".domain-picker-item");
    const checkedSiblings = currentPicker.parentNode.querySelectorAll(".domain-picker-item input[type=checkbox]:checked");

    if (checkedSiblings.length === siblings.length) {
      parentCheckbox.checked = true;
      parentCheckbox.nextElementSibling.classList.remove("is-indeterminate");
    } else if (checkedSiblings.length === 0) {
      parentCheckbox.checked = false;
      parentCheckbox.nextElementSibling.classList.remove("is-indeterminate");
    } else {
      parentCheckbox.checked = false;
      parentCheckbox.nextElementSibling.classList.add("is-indeterminate");
    }
  }

  /**
   * remove the domain tag
   * @param {string} text
   */
  function removeDomainTag(text) {
    const index = DomainPicker.domainTagsDom.indexOf(text);
    if (index > -1) {
      DomainPicker.domainTagsDom.splice(index, 1);
    }

    updateDomainTagsContainer();
  }

  /**
   * update the domain tags
   */
  function updateDomainTagsContainer() {
    const domainTagsContainer = document.querySelector("#domainTags");
    domainTagsContainer.innerHTML = "";

    DomainPicker.domainTagsDom.forEach(item => {
      const spanElement = document.createElement("span");
      spanElement.textContent = item;
      domainTagsContainer.appendChild(spanElement);
    });
  }

  /**
   * Update the domain tags based on the current selection
   * @param {*} currentText
   * @param {*} parentText
   * @param {*} isChecked
   */
  function updateDomainTags(currentText, parentText, isChecked) {
    if (isChecked) {
      if (parentText === DomainOptions.data[0].cname) {
        DomainPicker.domainTagsDom = [currentText];
      } else if (parentText) {
        const domainTag = `${parentText}-${currentText}`;
        if (!DomainPicker.domainTagsDom.includes(domainTag)) {
          DomainPicker.domainTagsDom.push(domainTag);
        }
      } else {
        DomainPicker.domainTagsDom = [currentText];
      }
    } else {
      removeDomainTag(currentText);
      removeDomainTag(`${parentText}-${currentText}`);
    }

    updateDomainTagsContainer();
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

  function bootstrap(container, datasets) {
    const componentId = "domain-picker-" + Math.random().toString(36).slice(-6);
    DomainPicker.ComponentId = componentId;
    DomainPicker.Domain = datasets;
    DomainPicker.domainTagsDom = [];
    initBaseContainer(container, componentId);

    return DomainPicker;
  }

  return bootstrap;
})();
