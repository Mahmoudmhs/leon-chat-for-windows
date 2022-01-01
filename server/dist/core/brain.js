"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _child_process = require("child_process");

var _langs = require("../../../core/langs.json");

var _log = _interopRequireDefault(require("../helpers/log"));

var _string = _interopRequireDefault(require("../helpers/string"));

var _synchronizer = _interopRequireDefault(require("./synchronizer"));

var _tts = _interopRequireDefault(require("../tts/tts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Brain {
  constructor(socket, lang) {
    this.socket = socket;
    this.lang = lang;
    this.broca = JSON.parse(_fs.default.readFileSync(`${__dirname}/../data/en.json`, 'utf8'));
    this.process = {};
    this.interOutput = {};
    this.finalOutput = {}; // Read into the language file

    const file = `${__dirname}/../data/${this.lang}.json`;

    if (_fs.default.existsSync(file)) {
      this.broca = JSON.parse(_fs.default.readFileSync(file, 'utf8'));
    }

    _log.default.title('Brain');

    _log.default.success('New instance');

    if (process.env.LEON_TTS === 'true') {
      // Init TTS
      this.tts = new _tts.default(this.socket, process.env.LEON_TTS_PROVIDER);
      this.tts.init();
    }
  }
  /**
   * Delete query object file
   */


  static deleteQueryObjFile(queryObjectPath) {
    try {
      _fs.default.unlinkSync(queryObjectPath);
    } catch (e) {
      _log.default.error(`Failed to delete query object file: ${e}`);
    }
  }
  /**
   * Make Leon talk
   */


  talk(rawSpeech, end = false) {
    _log.default.title('Leon');

    _log.default.info('Talking...');

    _log.default.info(rawSpeech);

    if (rawSpeech !== '') {
      if (process.env.LEON_TTS === 'true') {
        // Stripe HTML to a whitespace. Whitespace to let the TTS respects punctuation
        const speech = rawSpeech.replace(/<(?:.|\n)*?>/gm, ' ');
        this.tts.add(speech, end);
      }

      this.socket.emit('answer', rawSpeech);
    }
  }
  /**
   * Pickup speech info we need to return
   */


  wernicke(type, key, obj) {
    let answer = ''; // Choose a random answer or a specific one

    const property = this.broca.answers[type];

    if (property.constructor === [].constructor) {
      answer = property[Math.floor(Math.random() * property.length)];
    } else {
      answer = property;
    } // Select a specific key


    if (key !== '' && typeof key !== 'undefined') {
      answer = answer[key];
    } // Parse sentence's value(s) and replace with the given object


    if (typeof obj !== 'undefined' && Object.keys(obj).length > 0) {
      answer = _string.default.pnr(answer, obj);
    }

    return answer;
  }
  /**
   * Execute Python modules
   */


  execute(obj) {
    return new Promise((resolve, reject) => {
      const queryId = `${Date.now()}-${_string.default.random(4)}`;
      const queryObjectPath = `${__dirname}/../tmp/${queryId}.json`; // Ask to repeat if Leon is not sure about the request

      if (obj.classification.confidence < _langs.langs[process.env.LEON_LANG].min_confidence) {
        this.talk(`${this.wernicke('random_not_sure')}.`, true);
        this.socket.emit('is-typing', false);
        resolve();
      } else {
        // Ensure the process is empty (to be able to execute other processes outside of Brain)
        if (Object.keys(this.process).length === 0) {
          /**
           * Execute a module in a standalone way (CLI):
           *
           * 1. Need to be at the root of the project
           * 2. Edit: server/src/query-object.sample.json
           * 3. Run: PIPENV_PIPFILE=bridges/python/Pipfile pipenv run
           *    python bridges/python/main.py server/src/query-object.sample.json
           */
          const queryObj = {
            id: queryId,
            lang: _langs.langs[process.env.LEON_LANG].short,
            package: obj.classification.package,
            module: obj.classification.module,
            action: obj.classification.action,
            query: obj.query,
            entities: obj.entities
          };

          try {
            _fs.default.writeFileSync(queryObjectPath, JSON.stringify(queryObj));

            this.process = (0, _child_process.spawn)(`pipenv run python bridges/python/main.py ${queryObjectPath}`, {
              shell: true
            });
          } catch (e) {
            _log.default.error(`Failed to save query object: ${e}`);
          }
        }

        const packageName = _string.default.ucfirst(obj.classification.package);

        const moduleName = _string.default.ucfirst(obj.classification.module);

        let output = ''; // Read output

        this.process.stdout.on('data', data => {
          const obj = JSON.parse(data.toString());

          if (typeof obj === 'object') {
            if (obj.output.type === 'inter') {
              _log.default.title(`${packageName} package`);

              _log.default.info(data.toString());

              this.interOutput = obj.output;
              this.talk(obj.output.speech.toString());
            } else {
              output += data;
            }
          } else {
            /* istanbul ignore next */
            reject({
              type: 'warning',
              obj: new Error(`The ${moduleName} module of the ${packageName} package is not well configured. Check the configuration file.`)
            });
          }
        }); // Handle error

        this.process.stderr.on('data', data => {
          this.talk(`${this.wernicke('random_package_module_errors', '', {
            '%module_name%': moduleName,
            '%package_name%': packageName
          })}!`);
          Brain.deleteQueryObjFile(queryObjectPath);
          this.socket.emit('is-typing', false);

          _log.default.title(packageName);

          reject({
            type: 'error',
            obj: new Error(data)
          });
        }); // Catch the end of the module execution

        this.process.stdout.on('end', () => {
          _log.default.title(`${packageName} package`);

          _log.default.info(output);

          this.finalOutput = output; // Check if there is an output (no module error)

          if (this.finalOutput !== '') {
            this.finalOutput = JSON.parse(this.finalOutput).output;
            this.talk(this.finalOutput.speech.toString(), true);
            /* istanbul ignore next */
            // Synchronize the downloaded content if enabled

            if (this.finalOutput.type === 'end' && this.finalOutput.options.synchronization && this.finalOutput.options.synchronization.enabled && this.finalOutput.options.synchronization.enabled === true) {
              const sync = new _synchronizer.default(this, obj.classification, this.finalOutput.options.synchronization); // When the synchronization is finished

              sync.synchronize(speech => {
                this.talk(speech);
              });
            }
          }

          Brain.deleteQueryObjFile(queryObjectPath);
          this.socket.emit('is-typing', false);
          resolve();
        }); // Reset the child process

        this.process = {};
      }
    });
  }

}

var _default = Brain;
exports.default = _default;