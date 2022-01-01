"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cliSpinner = require("cli-spinner");

var _log = _interopRequireDefault(require("./log"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sentences = ['This process takes time, please go for a coffee (or a fruit juice)', 'This will take a while, grab a drink and come back later', 'Go for a walk, this action takes time', 'That will take some time, let\'s chill and relax', 'Leon will be ready for you in a moment'];
const spinner = new _cliSpinner.Spinner('\x1b[95m%s\x1b[0m\r').setSpinnerString(18);
const loader = {};
let intervalId = 0;
/**
 * Start spinner and log waiting sentences
 */

loader.start = () => {
  intervalId = setInterval(() => {
    if (spinner.isSpinning()) {
      _log.default.info(sentences[Math.floor(Math.random() * sentences.length)]);
    }
  }, 60000);
  return spinner.start();
};
/**
 * Stop spinner and sentences logging
 */


loader.stop = () => {
  clearInterval(intervalId);
  return spinner.stop();
};

var _default = loader;
exports.default = _default;