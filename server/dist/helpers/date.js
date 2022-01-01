"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _momentTimezone = _interopRequireDefault(require("moment-timezone"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const date = {};

date.dateTime = () => (0, _momentTimezone.default)().tz(date.timeZone()).format();

date.timeZone = () => {
  let timeZone = _momentTimezone.default.tz.guess();

  if (process.env.LEON_TIME_ZONE && !!_momentTimezone.default.tz.zone(process.env.LEON_TIME_ZONE)) {
    timeZone = process.env.LEON_TIME_ZONE;
  }

  return timeZone;
};

var _default = date;
exports.default = _default;