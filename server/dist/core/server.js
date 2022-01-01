"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fastify = _interopRequireDefault(require("fastify"));

var _fastifyStatic = _interopRequireDefault(require("fastify-static"));

var _socket = _interopRequireDefault(require("socket.io"));

var _path = require("path");

var _package = require("../../../package.json");

var _langs = require("../../../core/langs.json");

var _nlu = _interopRequireDefault(require("./nlu"));

var _brain = _interopRequireDefault(require("./brain"));

var _asr = _interopRequireDefault(require("./asr"));

var _stt = _interopRequireDefault(require("../stt/stt"));

var _cors = _interopRequireDefault(require("../plugins/cors"));

var _other = _interopRequireDefault(require("../plugins/other"));

var _info = _interopRequireDefault(require("../api/info"));

var _downloads = _interopRequireDefault(require("../api/downloads"));

var _log = _interopRequireDefault(require("../helpers/log"));

var _date = _interopRequireDefault(require("../helpers/date"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Server {
  constructor() {
    this.fastify = (0, _fastify.default)();
    this.httpServer = {};
    this.brain = {};
    this.nlu = {};
    this.asr = {};
    this.stt = {};
  }
  /**
   * Server entry point
   */


  async init() {
    this.fastify.addHook('onRequest', _cors.default);
    this.fastify.addHook('onRequest', _other.default);

    _log.default.title('Initialization');

    _log.default.success(`The current env is ${process.env.LEON_NODE_ENV}`);

    _log.default.success(`The current version is ${_package.version}`);

    if (!Object.keys(_langs.langs).includes(process.env.LEON_LANG) === true) {
      process.env.LEON_LANG = 'en-US';

      _log.default.warning('The language you chose is not supported, then the default language has been applied');
    }

    _log.default.success(`The current language is ${process.env.LEON_LANG}`);

    _log.default.success(`The current time zone is ${_date.default.timeZone()}`);

    const sLogger = process.env.LEON_LOGGER !== 'true' ? 'disabled' : 'enabled';

    _log.default.success(`Collaborative logger ${sLogger}`);

    await this.bootstrap();
  }
  /**
   * Bootstrap API
   */


  async bootstrap() {
    const apiVersion = 'v1'; // Render the web app

    this.fastify.register(_fastifyStatic.default, {
      root: (0, _path.join)(__dirname, '..', '..', '..', 'app', 'dist'),
      prefix: '/'
    });
    this.fastify.get('/', (_request, reply) => {
      reply.sendFile('index.html');
    });
    this.fastify.register(_info.default, {
      apiVersion
    });
    this.fastify.register(_downloads.default, {
      apiVersion
    }); // log.info(`infoPlugin: ${infoPlugin}  apiVersion:
    // ${apiVersion}  downloadsPlugin:  ${downloadsPlugin}`)

    this.httpServer = this.fastify.server;

    try {
      await this.listen(process.env.LEON_PORT);
    } catch (e) {
      _log.default.error(e.message);
    }
  }
  /**
   * Launch server
   */


  async listen(port) {
    const io = process.env.LEON_NODE_ENV === 'development' ? (0, _socket.default)(this.httpServer, {
      cors: {
        origin: `${process.env.LEON_HOST}:3000`
      }
    }) : (0, _socket.default)(this.httpServer);
    io.on('connection', this.connection);
    await this.fastify.listen(port, '0.0.0.0');

    _log.default.success(`Server is available at ${process.env.LEON_HOST}:${port}`);
  }
  /**
   * Bootstrap socket
   */


  async connection(socket) {
    _log.default.title('Client');

    _log.default.success('Connected'); // Init


    socket.on('init', async data => {
      _log.default.info(`Type: ${data}`);

      _log.default.info(`Socket id: ${socket.id}`);

      if (data === 'hotword-node') {
        // Hotword triggered
        socket.on('hotword-detected', data => {
          _log.default.title('Socket');

          _log.default.success(`Hotword ${data.hotword} detected`);

          socket.broadcast.emit('enable-record');
        });
      } else {
        let sttState = 'disabled';
        let ttsState = 'disabled';
        this.brain = new _brain.default(socket, _langs.langs[process.env.LEON_LANG].short);
        this.nlu = new _nlu.default(this.brain);
        this.asr = new _asr.default();
        /* istanbul ignore if */

        if (process.env.LEON_STT === 'true') {
          sttState = 'enabled';
          this.stt = new _stt.default(socket, process.env.LEON_STT_PROVIDER);
          this.stt.init();
        }

        if (process.env.LEON_TTS === 'true') {
          ttsState = 'enabled';
        }

        _log.default.title('Initialization');

        _log.default.success(`STT ${sttState}`);

        _log.default.success(`TTS ${ttsState}`); // Train modules expressions


        try {
          await this.nlu.loadModel((0, _path.join)(__dirname, '../data/leon-model.nlp'));
        } catch (e) {
          _log.default[e.type](e.obj.message);
        } // Listen for new query


        socket.on('query', async data => {
          _log.default.title('Socket');

          _log.default.info(`${data.client} emitted: ${data.value}`);

          socket.emit('is-typing', true);
          await this.nlu.process(data.value);
        }); // Handle automatic speech recognition

        socket.on('recognize', async data => {
          try {
            await this.asr.run(data, this.stt);
          } catch (e) {
            _log.default[e.type](e.obj.message);
          }
        });
      }
    });
  }

}

var _default = Server;
exports.default = _default;