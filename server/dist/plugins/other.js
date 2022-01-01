"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _log = _interopRequireDefault(require("../helpers/log"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const otherMidd = async (request, reply) => {
  // Disable from the header, else it makes hacker's life easier to know more about our system
  reply.removeHeader('X-Powered-By');

  _log.default.title('Requesting');

  _log.default.info(`${request.method} ${request.url}`);
};

var _default = otherMidd;
exports.default = _default;