"use strict";

var _dotenv = _interopRequireDefault(require("dotenv"));

var _server = _interopRequireDefault(require("./core/server"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  _dotenv.default.config();

  const server = new _server.default();
  await server.init();
})();