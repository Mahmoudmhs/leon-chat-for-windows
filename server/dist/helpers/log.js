"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _date = _interopRequireDefault(require("./date"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = {};

log.success = value => console.log('\x1b[32m✔ %s\x1b[0m', value);

log.info = value => console.info('\x1b[36m➡ %s\x1b[0m', value);

log.error = value => {
  const path = `${__dirname}/../../../logs/errors.log`;
  const errMessage = 'Not able to log the error';
  const data = `${_date.default.dateTime()} - ${value}`;

  if (process.env.LEON_NODE_ENV !== 'testing') {
    /* istanbul ignore next */
    if (!_fs.default.existsSync(path)) {
      _fs.default.writeFile(path, data, {
        flags: 'wx'
      }, err => {
        if (err) log.warning(errMessage);
      });
    } else {
      _fs.default.appendFile(path, `\n${data}`, err => {
        if (err) log.warning(errMessage);
      });
    }
  }

  return console.error('\x1b[31m✖ %s\x1b[0m', value);
};

log.warning = value => console.warn('\x1b[33m❗ %s\x1b[0m', value);

log.title = value => console.log('\n---\n\n\x1b[7m.: %s :.\x1b[0m\n', value.toUpperCase());

log.default = value => console.log('%s', value);

var _default = log;
exports.default = _default;