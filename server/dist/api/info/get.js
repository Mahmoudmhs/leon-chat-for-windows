"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _langs = require("../../../../core/langs.json");

var _package = require("../../../../package.json");

var _log = _interopRequireDefault(require("../../helpers/log"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getInfo = async (fastify, options) => {
  fastify.get(`/${options.apiVersion}/info`, (_request, reply) => {
    _log.default.title('GET /info');

    const message = 'Information pulled.';

    _log.default.success(message);

    reply.send({
      success: true,
      status: 200,
      code: 'info_pulled',
      message,
      after_speech: process.env.LEON_AFTER_SPEECH === 'true',
      logger: process.env.LEON_LOGGER === 'true',
      stt: {
        enabled: process.env.LEON_STT === 'true',
        provider: process.env.LEON_STT_PROVIDER
      },
      tts: {
        enabled: process.env.LEON_TTS === 'true',
        provider: process.env.LEON_TTS_PROVIDER
      },
      lang: _langs.langs[process.env.LEON_LANG],
      version: _package.version
    });
  });
};

var _default = getInfo;
exports.default = _default;