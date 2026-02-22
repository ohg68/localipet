/**
 * Localipet — Main JavaScript
 *
 * HTMX configuration and shared utilities.
 */

(function () {
    "use strict";

    // ── HTMX Config ────────────────────────────────────────

    document.addEventListener("DOMContentLoaded", function () {
        // Add CSRF token to all HTMX requests
        document.body.addEventListener("htmx:configRequest", function (evt) {
            const csrfToken = document.querySelector(
                "[name=csrfmiddlewaretoken]"
            );
            if (csrfToken) {
                evt.detail.headers["X-CSRFToken"] = csrfToken.value;
            } else {
                // Try getting from cookie
                const cookie = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("csrftoken="));
                if (cookie) {
                    evt.detail.headers["X-CSRFToken"] = cookie.split("=")[1];
                }
            }
        });

        // HTMX loading states
        document.body.addEventListener("htmx:beforeRequest", function (evt) {
            const target = evt.detail.elt;
            if (target.classList.contains("btn")) {
                target.dataset.originalText = target.innerHTML;
                target.innerHTML =
                    '<span class="spinner-border spinner-border-sm"></span>';
                target.disabled = true;
            }
        });

        document.body.addEventListener("htmx:afterRequest", function (evt) {
            const target = evt.detail.elt;
            if (target.dataset.originalText) {
                target.innerHTML = target.dataset.originalText;
                target.disabled = false;
                delete target.dataset.originalText;
            }
        });
    });

    // ── Auto-dismiss alerts ────────────────────────────────

    document.addEventListener("DOMContentLoaded", function () {
        const alerts = document.querySelectorAll(".alert-dismissible");
        alerts.forEach(function (alert) {
            setTimeout(function () {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
                if (bsAlert) {
                    bsAlert.close();
                }
            }, 5000);
        });
    });

    // ── Confirm dangerous actions ──────────────────────────

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-confirm]").forEach(function (el) {
            el.addEventListener("click", function (e) {
                if (!confirm(el.dataset.confirm)) {
                    e.preventDefault();
                }
            });
        });
    });

    // ── File upload preview ────────────────────────────────

    document.addEventListener("DOMContentLoaded", function () {
        document
            .querySelectorAll('input[type="file"][data-preview]')
            .forEach(function (input) {
                input.addEventListener("change", function () {
                    const previewId = this.dataset.preview;
                    const preview = document.getElementById(previewId);
                    if (preview && this.files && this.files[0]) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            preview.src = e.target.result;
                            preview.style.display = "block";
                        };
                        reader.readAsDataURL(this.files[0]);
                    }
                });
            });
    });

    // ── Toast helper ───────────────────────────────────────

    window.showToast = function (message, type) {
        type = type || "info";
        const container =
            document.querySelector(".toast-container") ||
            createToastContainer();
        const toastEl = document.createElement("div");
        toastEl.className = "toast";
        toastEl.setAttribute("role", "alert");

        // Build toast with textContent to prevent XSS
        const header = document.createElement("div");
        header.className = "toast-header";
        const strong = document.createElement("strong");
        strong.className = "me-auto text-" + type;
        strong.textContent = "Localipet";
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "btn-close";
        closeBtn.setAttribute("data-bs-dismiss", "toast");
        header.appendChild(strong);
        header.appendChild(closeBtn);

        const body = document.createElement("div");
        body.className = "toast-body";
        body.textContent = message;

        toastEl.appendChild(header);
        toastEl.appendChild(body);
        container.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();
        toastEl.addEventListener("hidden.bs.toast", function () {
            toastEl.remove();
        });
    };

    function createToastContainer() {
        const container = document.createElement("div");
        container.className =
            "toast-container position-fixed bottom-0 end-0 p-3";
        container.style.zIndex = "1090";
        document.body.appendChild(container);
        return container;
    }
})();
