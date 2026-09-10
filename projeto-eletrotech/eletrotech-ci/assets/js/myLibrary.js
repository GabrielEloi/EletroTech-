window.MyLib = window.MyLib || {};

(function () {
  window.MyLib.initClickOutsideObserver = () => {
    document.addEventListener("click", (event) => {
      const elements = document.querySelectorAll("[data-click-outside]");
      elements.forEach((element) => {
        if (!element.contains(event.target)) {
          const customEvent = new CustomEvent("clickOutside", {
            bubbles: false,
            detail: { originalEvent: event },
          });
          element.dispatchEvent(customEvent);
        }
      });
    });
  };
})();

(function () {
  window.MyLib.formatCurrency = (value, locale = "pt-BR", currency = "BRL") => {
    if (value === undefined || value === null || value === "") return "";
    const num =
      typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
    if (isNaN(num)) return "";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(num);
  };

  window.MyLib.maskSensitiveData = (str, visibleStart = 1, visibleEnd = 1) => {
    if (!str || typeof str !== "string") return "";
    if (str.length <= visibleStart + visibleEnd) return str;
    const start = str.slice(0, visibleStart);
    const end = str.slice(-visibleEnd);
    const masked = "*".repeat(str.length - visibleStart - visibleEnd);
    return `${start}${masked}${end}`;
  };
})();

(function () {
  window.MyLib.applyInputMask = (event, formatterFunction) => {
    const input = event.target;
    // cursor precisa ser reposicionado ou pula pro final após formatar
    const cursorPosition = input.selectionStart;
    const previousLength = input.value.length;
    input.value = formatterFunction(input.value);
    const currentLength = input.value.length;
    input.setSelectionRange(
      cursorPosition + (currentLength - previousLength),
      cursorPosition + (currentLength - previousLength),
    );
  };

  window.MyLib.maskPhone = (value) => {
    if (!value) return "";
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .substring(0, 15);
  };

  window.MyLib.setRequired = (input, isRequired, options = {}) => {
    if (!input) return;
    input.required = isRequired;

    const config = {
      wrapperSelector: ".div-input",
      labelSelector: "label",
      requiredClass: null,
      ...options,
    };

    const wrapper = input.closest(config.wrapperSelector);
    const label = wrapper?.querySelector(config.labelSelector);

    if (label) {
      if (isRequired) {
        if (config.requiredClass) {
          label.classList.add(config.requiredClass);
        } else {
          label.dataset.required = "true";
        }
      } else {
        if (config.requiredClass) {
          label.classList.remove(config.requiredClass);
        } else {
          delete label.dataset.required;
        }
        input.setCustomValidity("");
      }
    }
  };

  window.MyLib.initPasswordToggle = (options = {}) => {
    const config = {
      iconSelector: ".ml-input-icon",
      iconShow: "fa-eye",
      iconHide: "fa-eye-slash",
      wrapperSelector: ".div-input",
      inputSelector: "input",
      ...options,
    };

    document.querySelectorAll(config.iconSelector).forEach((icon) => {
      icon.addEventListener("click", () => {
        const wrapper = icon.closest(config.wrapperSelector);
        const input = wrapper
          ? wrapper.querySelector(config.inputSelector)
          : null;

        if (input && (input.type === "password" || input.type === "text")) {
          if (input.type === "password") {
            input.type = "text";
            icon.classList.replace(config.iconShow, config.iconHide);
          } else {
            input.type = "password";
            icon.classList.replace(config.iconHide, config.iconShow);
          }
        } else {
          console.warn(
            "MyLib.initPasswordToggle: input não encontrado dentro do wrapper especificado.",
            wrapper,
          );
        }
      });
    });
  };
})();

(function () {
  window.MyLib.slugify = (text) => {
    if (!text) return "";
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  };

  window.MyLib.capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
})();

(function () {
  window.MyLib.toggleTheme = () => {
    const htmlTag = document.documentElement;
    const currentTheme = htmlTag.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    htmlTag.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  window.MyLib.initTheme = () => {
    const savedTheme = localStorage.getItem("app-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const themeToApply = savedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", themeToApply);
  };
})();

(function () {
  window.MyLib.initAutoResize = (textarea) => {
    if (!textarea || textarea.tagName !== "TEXTAREA") return;
    const resize = () => {
      // reseta pra auto antes de medir, senão não encolhe
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener("input", resize);
    resize();
  };

  window.MyLib.scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      console.warn(
        `MyLib.scrollToElement: elemento com ID '${elementId}' não encontrado.`,
      );
    }
  };

  window.MyLib.filterList = (
    listElement,
    searchTerm,
    itemSelector = ".list-item",
  ) => {
    if (!listElement) {
      console.warn("MyLib.filterList: elemento de lista não fornecido.");
      return;
    }
    const items = listElement.querySelectorAll(itemSelector);
    const term = searchTerm.toLowerCase().trim();
    items.forEach((item) => {
      // display "" respeita o valor original do elemento, "block" não
      item.style.display = item.textContent.toLowerCase().includes(term)
        ? ""
        : "none";
    });
  };

  window.MyLib.sortTable = (table, columnIndex, isAscending = true) => {
    if (!table || !(table instanceof HTMLTableElement)) {
      console.warn("MyLib.sortTable: elemento de tabela inválido.", table);
      return;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody) {
      console.warn("MyLib.sortTable: tabela não possui tbody.");
      return;
    }
    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.sort((rowA, rowB) => {
      const cellA = rowA.children[columnIndex]?.textContent || "";
      const cellB = rowB.children[columnIndex]?.textContent || "";
      const valA = parseFloat(cellA.replace(",", "."));
      const valB = parseFloat(cellB.replace(",", "."));
      if (!isNaN(valA) && !isNaN(valB)) {
        return isAscending ? valA - valB : valB - valA;
      }
      return isAscending
        ? cellA.localeCompare(cellB)
        : cellB.localeCompare(cellA);
    });
    rows.forEach((row) => tbody.appendChild(row));
  };
})();

(function () {
  window.MyLib.isStrongPassword = (password) => {
    if (!password || typeof password !== "string") return false;
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@$!%*?&#]/.test(password);
    return (
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  window.MyLib.isValidCPF = (cpf) => {
    if (!cpf || typeof cpf !== "string") return false;
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    // CPFs com todos os dígitos iguais passam na soma mas são inválidos
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  };

  window.MyLib.isValidCNPJ = (cnpj) => {
    if (!cnpj || typeof cnpj !== "string") return false;
    cnpj = cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    const validate = (str, weightStart) => {
      let sum = 0;
      let pos = weightStart;
      for (let i = 0; i < str.length; i++) {
        sum += parseInt(str.charAt(i)) * pos--;
        if (pos < 2) pos = 9;
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    // Valida o primeiro dígito (peso começa em 5 para os primeiros 12 números)
    const firstDigit = validate(cnpj.substring(0, 12), 5);
    if (firstDigit !== parseInt(cnpj.charAt(12))) return false;

    // Valida o segundo dígito (peso começa em 6 para os primeiros 13 números)
    const secondDigit = validate(cnpj.substring(0, 13), 6);
    if (secondDigit !== parseInt(cnpj.charAt(13))) return false;

    return true;
  };
})();
