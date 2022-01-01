"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = _interopRequireDefault(require("os"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const os = {};
/**
 * Returns information about your OS
 */

os.get = () => {
  let type = 'unknown';
  let name = '';

  if (_os.default.type().indexOf('Windows') !== -1) {
    type = 'windows';
    name = 'Windows';
  } else if (_os.default.type() === 'Darwin') {
    type = 'macos';
    name = 'macOS';
  } else if (_os.default.type() === 'Linux') {
    type = 'linux';
    name = 'Linux';
  }

  return {
    type,
    name
  };
};
/**
 * Returns the number of cores on your machine
 */


os.cpus = () => _os.default.cpus();

var _default = os;
exports.default = _default;