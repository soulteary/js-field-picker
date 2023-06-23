window.FieldPicker = function (container, options) {
  var Picker = {
    // expose states
    ComponentId: "",
    Options: {},
    Selected: [], // user selected data
    Fields: {
      RootField: {},
      MainField: [],
      States: {},
    }, // original data
    Skips: [], // skip data list
    TriggerEachClick: false,
    // expose functions
    GetSelected: GetSelected,
    Show: ShowPicker,
    Hide: HidePicker,
  };

  function GetSelected() {
    return this.Selected;
  }

  function Feedback() {
    if (Picker.Options && Picker.Options.updater && typeof Picker.Options.updater === "function") {
      Picker.Options.updater(Picker.Selected);
    }
  }

  function getRootField(datasets) {
    const [rootInfo] = datasets;
    const { cname, code } = rootInfo;
    const allChildrenChecked = datasets.every((dataset) => dataset.checked);
    const state = allChildrenChecked ? "checked" : "";

    return `
      <div class="field-picker-row-container">
        <div class="field-picker-title clickable">${cname}</div>
        <div class="field-picker-checkbox-container">
          <label for="field-${code}" class="field-picker-checkbox-label field-picker-checkbox-group">
            <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
            <span class="field-checkbox-item clickable"></span>
          </label>
        </div>
      </div>
    `;
  }

  function getSingleField(dataset) {
    const { name, cname, code, checked, link, children } = dataset;
    const state = checked ? "checked" : "";
    let content = `
      <div class="field-picker-row-container">
        <div class="field-picker-title">${cname}</div>
        <div class="field-picker-checkbox-container">
          <label for="field-${code}" class="field-picker-checkbox-label field-picker-checkbox-group">
            <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
            <span class="field-checkbox-item clickable"></span>
          </label>
        </div>
      </div>
    `;

    if (children && children.length) {
      const allChildrenChecked = children.every((child) => child.checked);
      const indeterminateState = !allChildrenChecked && children.some((child) => child.checked);

      content = `
        <div class="field-picker-row-container">
          <div class="field-picker-menu-group">
            <div class="field-picker-sign clickable">+</div>
            <div class="field-picker-title clickable">${cname}</div>
          </div>
          <div class="field-picker-checkbox-container">
            <label for="field-${code}" class="field-picker-checkbox-label field-picker-checkbox-group">
              <input id="field-${code}" type="checkbox" name="field-${code}" value="${code}" ${state}>
              <span class="field-checkbox-item clickable ${indeterminateState ? "is-indeterminate" : ""}"></span>
            </label>
          </div>
        </div>
        ${getSingleFieldChildren(children)}
      `;
    }

    return `
      <div class="field-picker-item-group">
        ${content}
      </div>
    `;
  }

  function getSingleFieldChildren(dataset) {
    if (!dataset || !dataset.length) {
      return "";
    }

    return `
      <div class="field-picker-children-group hide">
        ${dataset.map((item) => getSingleField(item)).join("")}
      </div>
    `;
  }

  function InitBaseContainer(container, componentId) {
    const template = `
      <div id="${componentId}" class="field-picker-container no-select">
        <div class="field-picker-item-group">
          ${getRootField(Picker.Fields.RootField)}
          <div class="field-picker-children-group">
            ${Picker.Fields.MainField.map((dataset) => getSingleField(dataset)).join("")}
          </div>
        </div>
      </div>
    `;

    const containerElement = document.querySelector(container);
    containerElement.innerHTML = template;

    bindCheckboxEvents(containerElement);

    updateSelectData(containerElement);
  }

  /**
   * Update the select data of the field picker based on the expanded content
   * @param {*} containerElement
   */
  function updateSelectData(containerElement) {
    const checkboxes = containerElement.querySelectorAll(".field-picker-checkbox-label input[type=checkbox]");
    checkboxes.forEach((checkbox) => {
      updateParentCheckboxState(checkbox);
    });

    Picker.Selected = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const fieldId = checkbox.value;
        Picker.Selected.push(fieldId);
      }
    });

    if (Picker.TriggerEachClick) {
      Feedback();
    }
  }

  /**
   * checkbox bind event
   */
  function bindCheckboxEvents(containerElement) {
    containerElement.addEventListener("click", function (event) {
      const checkbox = event.target.closest(".field-picker-checkbox-label input[type=checkbox]");
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
    const parentItem = checkbox.closest(".field-picker-item-group");
    const parentCheckboxWrapper = parentItem.parentNode.parentNode.querySelector(".field-checkbox-item");
    const siblings = parentItem.parentNode.querySelectorAll(".field-picker-item-group");
    const checkedSiblings = parentItem.parentNode.querySelectorAll(".field-picker-item-group input[type=checkbox]:checked");

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

    const parentPicker = parentItem.parentNode.parentNode.closest(".field-picker-item-group");
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
    const currentPicker = checkbox.closest(".field-picker-item-group");
    const childrenPicker = currentPicker.querySelector(".field-picker-children-group");

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
      childCheckboxes.forEach((childCheckbox) => {
        childCheckbox.checked = isChecked;
      });
    }
  }

  /**
   * Function to update the state of the parent checkbox
   * @param {*} checkbox
   */
  function updateParentState(checkbox) {
    const parentItem = checkbox.closest(".field-picker-children-group");
    if (parentItem) {
      const parentCheckbox = parentItem.previousElementSibling.querySelector("input[type=checkbox]");
      const siblings = parentItem.querySelectorAll(".field-picker-item-group");
      const checkedSiblings = parentItem.querySelectorAll(".field-picker-item-group input[type=checkbox]:checked");

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

  function triggerExpend(btnExpend, forceState) {
    if (!btnExpend) return;
    const children = btnExpend.closest(".field-picker-item-group").querySelector(".field-picker-children-group");
    if (typeof forceState === "string") {
      if (forceState === "expand") {
        children.classList.remove("hide");
        btnExpend.textContent = "-";
      } else if (forceState === "collapse") {
        children.classList.add("hide");
        btnExpend.textContent = "+";
      }
    } else {
      const isHidden = children.classList.contains("hide");
      if (isHidden) {
        children.classList.remove("hide");
        btnExpend.textContent = "-";
      } else {
        children.classList.add("hide");
        btnExpend.textContent = "+";
      }
    }
  }

  function handleExpendClick() {
    const container = document.getElementById(Picker.ComponentId);
    container.addEventListener("click", function (event) {
      const btnExpend = event.target.closest(".field-picker-sign");
      triggerExpend(btnExpend);
    });
  }

  function handleTitleClick() {
    const container = document.getElementById(Picker.ComponentId);
    container.addEventListener("click", function (event) {
      if (!event.target.closest(".field-picker-title")) return;
      const rowContainer = event.target.closest(".field-picker-menu-group");
      if (rowContainer) {
        const btnExpend = rowContainer.querySelector(".field-picker-sign");
        if (btnExpend) {
          triggerExpend(btnExpend);
        }
      } else {
        const container = event.target.closest(".field-picker-item-group").querySelector(".field-picker-children-group");
        const btnExpends = container.querySelectorAll(".field-picker-sign");

        const allExpendStates = Array.from(btnExpends)
          .map((btnExpend) => btnExpend.innerHTML.trim() == "-")
          .filter((n) => n);

        if (allExpendStates.length !== btnExpends.length) {
          btnExpends.forEach((btnExpend) => {
            triggerExpend(btnExpend, "expand");
          });
        } else {
          btnExpends.forEach((btnExpend) => {
            triggerExpend(btnExpend);
          });
        }
      }
    });
  }

  /**
   * Show the region picker
   */
  function ShowPicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className.replace(/\s?hide/g, "");
  }

  /**
   * Hide the region picker
   */
  function HidePicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className + " hide";
    Feedback();
  }

  function Bootstrap(container, options) {
    const componentId = "field-picker-" + Math.random().toString(36).slice(-6);
    Picker.ComponentId = componentId;

    Picker.Options = options;
    const { data, preselected, skips, triggerEachClick } = options;

    Picker.Fields.RootField = [data[0]];
    Picker.Fields.MainField = data.slice(1);
    Picker.States = Picker.Fields.MainField.map((field) => {
      return { code: field.code, children: field.children.map((item) => item.code) };
    }).reduce((prev, item) => {
      prev[item.code] = item.children.reduce((prev, item) => {
        prev[item] = false;
        return prev;
      }, {});
      return prev;
    }, {});

    console.log("stats", Picker.States);

    Picker.TriggerEachClick = triggerEachClick || false;

    const checkboxCheckedbyRemoteAPI = data
      .map((field) => {
        if (field.children && field.children.length) {
          return field.children.filter((item) => item.checked);
        }
        return false;
      })
      .filter((n) => n)
      .reduce((a, b) => a.concat(b), [])
      .map((item) => item.code);

    Picker.Selected = checkboxCheckedbyRemoteAPI;
    if (preselected) {
      if (typeof preselected === "string") {
        // use all fields
        if (preselected === "all") {
          Picker.Selected = Picker.Fields.MainField.map((field) => field.code).concat(Picker.Fields.RootField.map((field) => field.code));
        } else {
          if (!Picker.Selected.includes(preselected)) {
            Picker.Selected = Picker.Selected.concat(preselected);
          }
        }
      } else if (preselected && preselected.length) {
        preselected.forEach((selected) => {
          if (!Picker.Selected.includes(selected)) {
            Picker.Selected = Picker.Selected.concat(selected);
          }
        });
      }
    }

    if (skips) {
      if (typeof skips === "string") {
        Picker.Skips = [skips];
      } else if (skips.length) {
        Picker.Skips = skips;
      }
    }

    InitBaseContainer(container, componentId);

    handleExpendClick();
    handleTitleClick();

    Feedback();

    return Picker;
  }

  return Bootstrap(container, options);
};
