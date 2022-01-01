"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _get = _interopRequireDefault(require("./get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const downloadsPlugin = async (fastify, options) => {
  // Get downloads to download module content
  fastify.register(_get.default, options);
};

var _default = downloadsPlugin;
exports.default = _default;