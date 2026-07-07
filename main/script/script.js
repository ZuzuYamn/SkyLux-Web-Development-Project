const header = document.getElementById("header");
let lastScrollPosition = 0;

//set the header to the visible state
header.classList.add("active");

const activeElemOnScroll = function () {
    const currentScrollPosition = window.scrollY;

    // check near the top
    if (currentScrollPosition < 50) { 
        header.classList.add("active");
        header.classList.remove("slide-out"); // Stop any pending hide animation
    } else {
        //check scroll direction
        if (currentScrollPosition < lastScrollPosition) {
            header.classList.add("active");
            header.classList.remove("slide-out"); 
            
        } else {
            header.classList.remove("active"); 
            header.classList.add("slide-out");
        }
    }

    lastScrollPosition = currentScrollPosition;
};

const addEventOnElem = function (elem, type, callback) {
    if (elem.length > 1) {
        for (let i = 0; i < elem.length; i++) {
            elem[i].addEventListener(type, callback);
        }
    } else {
        elem.addEventListener(type, callback);
    }
}

addEventOnElem(window, "scroll", activeElemOnScroll);


document.addEventListener('DOMContentLoaded', () => {
  const headers = Array.from(document.querySelectorAll('.accordion-header'));

  function closePanel(panel, header) {
    header.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = null;
  }

  function openPanel(panel, header) {
    header.setAttribute('aria-expanded', 'true');
    // Set maxHeight to scrollHeight for transition; allow slight extra for padding
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }

  function toggle(header, focus = false) {
    const panelId = header.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const expanded = header.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closePanel(panel, header);
    } else {
      openPanel(panel, header);
    }
    if (focus) header.focus();
  }

  headers.forEach((h, idx) => {
    const panel = document.getElementById(h.getAttribute('aria-controls'));
    if (!panel) return;

    // Click toggles
    h.addEventListener('click', () => toggle(h, true));

    // Keyboard support: Enter / Space to toggle, arrows to move focus
    h.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggle(h, true);
      }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const next = ev.key === 'ArrowDown' ? (idx + 1) % headers.length : (idx - 1 + headers.length) % headers.length;
        headers[next].focus();
      }
    });

    // Ensure height updates if inner content changes while open
    panel.addEventListener('transitionend', () => {
      if (h.getAttribute('aria-expanded') === 'true') {
        // keep it synced with current content height
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        panel.style.maxHeight = null;
      }
    });


  });


});


(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    //btns
    var sections = {
      about: { navId: 'aboutbutt', headerId: 'btn-about', panelId: 'panel-about' },
      services: { navId: 'servicesbutt', headerId: 'btn-services', panelId: 'panel-services' },
      features: { navId: 'featuresbutt', headerId: 'btn-features', panelId: 'panel-features' },
      contact: { navId: 'contactbutt', headerId: 'btn-contact', panelId: 'panel-contact' }
    };

    //Try to open a given section
    function openSectionByKey(key, opts) {
      opts = opts || {};
      var normalized = String(key || '').toLowerCase();

      //Accept different incoming forms
      if (normalized.indexOf('panel-') === 0) {
        normalized = normalized.replace('panel-', '');
      } else if (normalized.indexOf('btn-') === 0) {
        normalized = normalized.replace('btn-', '');
      }

      var info = sections[normalized];
      if (!info) return;

      //Locate header element using headerId
      var header = document.getElementById(info.headerId) ||
                   document.querySelector('.accordion-header[aria-controls="' + info.panelId + '"]');

      if (!header) return;

      // If already open, focus & scroll
      if (header.getAttribute('aria-expanded') === 'true') {
        try {
          header.focus({ preventScroll: true });
        } catch (e) {
          header.focus();
        }
        if (opts.scrollIntoView) {
          //iza maftouh, btenzal aalya
          header.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

    
      // If nav element is a link with default anchor behavior, allow that then open.
      requestAnimationFrame(function () {
        header.click();
        setTimeout(function () {
          try {
            header.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (e) {
            // ignore
          }
        }, 140);
      });
    }

    // Attach listeners to nav buttons
    Object.keys(sections).forEach(function (key) {
      var navEl = document.getElementById(sections[key].navId);
      if (!navEl) {
        var alt = document.querySelector('[id$="' + key + '"]');
        if (alt) navEl = alt;
      }
      if (!navEl) return;

      navEl.addEventListener('click', function (ev) {
        // Allow default navigation to happenthen open the panel
        setTimeout(function () {
          openSectionByKey(key, { scrollIntoView: true });
        }, 40);
      });

      // Also handle keyboard activation if nav item is not a <button>
      navEl.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          openSectionByKey(key, { scrollIntoView: true });
        }
      });
    });

    // Open on page load if the hash references a known section
    function openFromHash() {
      var hash = (location.hash || '').replace('#', '').toLowerCase();
      if (!hash) return;
      // Accept hashes like #about #panel-about #btn-about
      if (hash.indexOf('panel-') === 0) hash = hash.replace('panel-', '');
      if (hash.indexOf('btn-') === 0) hash = hash.replace('btn-', '');
      if (sections[hash]) {
        setTimeout(function () {
          //bteftah l section l matloube w byenzl
          openSectionByKey(hash, { scrollIntoView: true });
        }, 80);
      }
    }

    openFromHash();

    // Respond to hashchange events as well
    window.addEventListener('hashchange', openFromHash, false);

    try {
      Object.defineProperty(window, '__openSection', {
        value: function (name) {
          try {
            openSectionByKey(name, { scrollIntoView: true });
          } catch (e) { /* ignr */ }
        },
        writable: false,
        configurable: true
      });
    } catch (e) {
      window.__openSection = function (name) { openSectionByKey(name, { scrollIntoView: true }); };
    }
  });
})();



/*
For Contact section 
*/

const form = document.querySelector("form");

form.addEventListener("submit", (e)=> {
  e.preventDefault();
  //do nothing if form not validated
  if(!validateform(form)) return;

  //if form valid submit
  alert("Message Sent");

});

const validateform = (form) => {
  let valid = true;
  //chack for empry fields
  let name = form.querySelector(".contactus-name");
  let message = form.querySelector(".contactus-messagebox");
  let email = form.querySelector(".contactus-email");

  if(name.value === "") {
    giveError(name, "Please enter your name");
    valid=false;
  }

    if(message.value === "") {
    giveError(message, "Please enter a message");
    valid = false;
  }

  //email validation
  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let emailValue = email.value;
  if(!emailRegex.test(emailValue)) {
    giveError(email, "Please Enter a valid email");
    valid = false;
  }

  //return true if valid
  if(valid) {
    return true;
  }

};

const giveError = (field, message) => {
  let parentElement = field.parentElement;
  parentElement.classList.add("error");
  //if error msg already exist, remove it
  let existingError = parentElement.querySelector(".err-msg");
  if(existingError) {
    existingError.remove()
  }
  let error = document.createElement("span");
  error.textContent = message;
  error.classList.add("err-msg");
  parentElement.appendChild(error);
};



const inputs = document.querySelectorAll("input");
const textareas = document.querySelectorAll("textarea");

let allFields = [... inputs, ... textareas]

allFields.forEach((field) => {
  field.addEventListener("input", () => {
    removeError(field);
  });
});

const removeError = (field) => {
  let parentElement = field.parentElement;
  parentElement.classList.remove("error");
  let error = parentElement.querySelector(".err-msg")
  if (error) {
    error.remove();
  }
}