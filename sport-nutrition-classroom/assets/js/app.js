(function (global) {
  "use strict";

  const APP = Object.freeze({
    formatThaiDate(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("th-TH", {
        day: "numeric", month: "long", year: "numeric"
      }).format(date);
    },

    formatTime24(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("th-TH", {
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).format(date);
    },

    createRequestId() {
      if (global.crypto && typeof global.crypto.randomUUID === "function") {
        return global.crypto.randomUUID();
      }
      return "req-" + Date.now().toString(36) + "-" +
        Math.random().toString(36).slice(2, 10);
    },

    makeApiRequest(action, payload, options) {
      if (!action || typeof action !== "string") {
        throw new TypeError("API action is required");
      }
      const request = {
        action,
        requestId: APP.createRequestId(),
        payload: payload && typeof payload === "object" ? payload : {}
      };
      if (options && options.idempotencyKey) {
        request.idempotencyKey = options.idempotencyKey;
      }
      return request;
    }
  });

  global.SNCApp = APP;
})(window);
