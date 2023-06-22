window.FieldPicker = (function () {
  var FieldPicker = {
    Show: showPicker,
    Hide: hidePicker,
    GetSelected: function () {
      return this.Selected;
    },

    options: {},
    Selected: null,
    Field: null,
    ComponentId: "",
    onChange: null,
  };

  function getRootField(datasets) {
    const [rootInfo] = datasets;
    const { cname, code } = rootInfo;
    const allChildrenChecked = datasets.every(dataset => dataset.checked);
    const state = allChildrenChecked ? "checked" : "";

    return `
      <div class="flex flex-row justify-between">
        <div class="field-picker-title">${cname}</div>
        <div>
          <label for="field-${code}" class="field-checkBox checkBox-inner">
            <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
            <span class="checkBox"></span>
          </label>
        </div>
      </div>
    `;
  }

  function getSingleField(dataset) {
    const { name, cname, code, checked, link, children } = dataset;
    const state = checked ? "checked" : "";
    let content = `
      <div class="flex flex-row justify-between">
        <div class="field-picker-title">${cname}</div>
        <div>
          <label for="field-${code}" class="field-checkBox checkBox-inner">
            <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
            <span class="checkBox"></span>
          </label>
        </div>
      </div>
    `;

    if (children && children.length) {
      const allChildrenChecked = children.every(child => child.checked);
      const indeterminateState = !allChildrenChecked && children.some(child => child.checked);

      content = `
        <div class="flex flex-row justify-between">
          <div class="flex flex-row">
            <div class="field-picker-append">-</div>
            <div class="field-picker-title">${cname}</div>
          </div>
          <div>
            <label for="field-${code}" class="field-checkBox checkBox-inner">
              <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
              <span class="checkBox ${indeterminateState ? "is-indeterminate" : ""}"></span>
            </label>
          </div>
        </div>
        ${getSingleFieldChildren(children)}
      `;
    }

    return `
      <div class="field-picker-item">
        ${content}
      </div>
    `;
  }

  function getSingleFieldChildren(dataset) {
    if (!dataset || !dataset.length) {
      return "";
    }

    return `
      <div class="field-picker-item-children">
        ${dataset.map(item => getSingleField(item)).join("")}
      </div>
    `;
  }

  function initBaseContainer(container, componentId) {
    const template = `
      <div id="${componentId}" class="picker-box field-picker">
        <div class="field-picker-item">
          ${getRootField(FieldOptions.data)}
          <div class="field-picker-item-children">
            ${FieldOptions.data
              .slice(1)
              .map(dataset => getSingleField(dataset))
              .join("")}
          </div>
        </div>
      </div>
    `;

    const containerElement = document.querySelector(container);
    containerElement.innerHTML = template;

    bindAppendEvents(containerElement);
    bindCheckboxEvents(containerElement);

    updateSelectData(containerElement);
  }

  /**
   * Attach event listeners to field append +/-
   */
  function bindAppendEvents(containerElement) {
    containerElement.addEventListener("click", function (event) {
      const appendIcon = event.target.closest(".field-picker-append");
      if (appendIcon) {
        const children = appendIcon.closest(".field-picker-item").querySelector(".field-picker-item-children");
        const isHidden = children.classList.contains("hide");
        if (isHidden) {
          children.classList.remove("hide");
          appendIcon.textContent = "-";
        } else {
          children.classList.add("hide");
          appendIcon.textContent = "+";
        }

        updatePickerMaxHeight(containerElement);
      }
    });

    updatePickerMaxHeight(containerElement);
  }

  /**
   * Update the max-height of the field picker based on the expanded content
   * @param {*} containerElement
   */
  function updatePickerMaxHeight(containerElement) {
    const picker = containerElement.querySelector(".field-picker");
    const expandedContent = picker.querySelector(".field-picker-item-children");
    const expandedContentHeight = expandedContent.offsetHeight;
    const pickerPadding = 24;
    const pickerMaxHeight = expandedContentHeight + pickerPadding;
    picker.style.maxHeight = pickerMaxHeight + "px";
  }

  /**
   * Update the select data of the field picker based on the expanded content
   * @param {*} containerElement
   */
  function updateSelectData(containerElement) {
    const checkboxes = containerElement.querySelectorAll(".field-checkBox input[type=checkbox]");
    checkboxes.forEach(checkbox => {
      updateParentCheckboxState(checkbox);
    });

    FieldPicker.Selected = [];
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const fieldId = checkbox.value;
        FieldPicker.Selected.push(fieldId);
      }
    });

    if (FieldPicker.options.updater && typeof FieldPicker.options.updater === "function") {
      FieldPicker.options.updater(FieldPicker.Selected);
    }

    // Call the onChange callback
    if (FieldPicker.onChange && typeof FieldPicker.onChange === "function") {
      FieldPicker.onChange(FieldPicker.Selected);
    }
  }

  /**
   * checkbox bind event
   */
  function bindCheckboxEvents(containerElement) {
    containerElement.addEventListener("click", function (event) {
      const checkbox = event.target.closest(".field-checkBox input[type=checkbox]");
      if (checkbox) {
        handleCheckboxClick(checkbox, containerElement);

        updateSelectData(containerElement);
      }
    });
  }

  /**
   * Update the parent checkboxes based on the initial selection of children
   * @param {*} checkbox
   */
  function updateParentCheckboxState(checkbox) {
    const parentItem = checkbox.closest(".field-picker-item");
    const parentCheckboxWrapper = parentItem.parentNode.parentNode.querySelector(".checkBox");
    const siblings = parentItem.parentNode.querySelectorAll(".field-picker-item");
    const checkedSiblings = parentItem.parentNode.querySelectorAll(".field-picker-item input[type=checkbox]:checked");

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

    const parentPicker = parentItem.parentNode.parentNode.closest(".field-picker-item");
    if (parentPicker) {
      const parentCheckbox = parentPicker.querySelector("input[type=checkbox]");
      updateParentCheckboxState(parentCheckbox);
    }

    updateParentState(checkbox);
  }

  /**
   * Function to handle checkbox events
   * @param {*} checkbox
   */
  function handleCheckboxClick(checkbox) {
    const isChecked = checkbox.checked;
    const currentPicker = checkbox.closest(".field-picker-item");
    const childrenPicker = currentPicker.querySelector(".field-picker-item-children");

    toggleChildrenCheckboxes(childrenPicker, isChecked);

    updateParentCheckboxState(checkbox);
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
   * @param {*} checkbox
   */
  function updateParentState(checkbox) {
    const parentItem = checkbox.closest(".field-picker-item-children");
    if (parentItem) {
      const parentCheckbox = parentItem.previousElementSibling.querySelector("input[type=checkbox]");
      const siblings = parentItem.querySelectorAll(".field-picker-item");
      const checkedSiblings = parentItem.querySelectorAll(".field-picker-item input[type=checkbox]:checked");

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
   * Show the field picker
   */
  function showPicker() {
    document.getElementById(FieldPicker.ComponentId).classList.remove("hide");
  }

  /**
   * Hide the field picker
   */
  function hidePicker() {
    document.getElementById(FieldPicker.ComponentId).classList.add("hide");
  }

  function bootstrap(container, options) {
    const { datasets } = options;
    const componentId = "field-picker-" + Math.random().toString(36).slice(-6);
    FieldPicker.ComponentId = componentId;
    FieldPicker.Field = datasets;
    FieldPicker.Selected = [];
    FieldPicker.options = options;
    FieldPicker.onChange = options.onChange;

    initBaseContainer(container, componentId);
    return FieldPicker;
  }

  return bootstrap;
})();