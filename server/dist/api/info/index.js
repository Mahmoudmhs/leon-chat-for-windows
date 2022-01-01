"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _get = _interopRequireDefault(require("./get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const infoPlugin = async (fastify, options) => {
  // Get information to init client
  fastify.register(_get.default, options);
};

var _default = infoPlugin;
exports.default = _default;