"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _coreLoader = require("@nlpjs/core-loader");

var _nlp = require("@nlpjs/nlp");

var _superagent = _interopRequireDefault(require("superagent"));

var _fs = _interopRequireDefault(require("fs"));

var _path = require("path");

var _langs = require("../../../core/langs.json");

var _package = require("../../../package.json");

var _ner = _interopRequireDefault(require("./ner"));

var _log = _interopRequireDefault(require("../helpers/log"));

var _string = _interopRequireDefault(require("../helpers/string"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Nlu {
  constructor(brain) {
    this.brain = brain;
    this.request = _superagent.default;
    this.nlp = {};
    this.ner = new _ner.default();

    _log.default.title('NLU');

    _log.default.success('New instance');
  }
  /**
   * Load the NLP model from the latest training
   */


  loadModel(nlpModel) {
    return new Promise(async (resolve, reject) => {
      if (!_fs.default.existsSync(nlpModel)) {
        _log.default.title('NLU');

        reject({
          type: 'warning',
          obj: new Error('The NLP model does not exist, please run: npm run train expressions')
        });
      } else {
        _log.default.title('NLU');

        try {
          const container = await (0, _coreLoader.containerBootstrap)();
          this.nlp = new _nlp.Nlp({
            container
          });
          await this.nlp.load(nlpModel);

          _log.default.success('NLP model loaded');

          resolve();
        } catch (err) {
          this.brain.talk(`${this.brain.wernicke('random_errors')}! ${this.brain.wernicke('errors', 'nlu', {
            '%error%': err.message
          })}.`);
          this.brain.socket.emit('is-typing', false);
          reject({
            type: 'error',
            obj: err
          });
        }
      }
    });
  }
  /**
   * Classify the query,
   * pick-up the right classification
   * and extract entities
   */


  async process(query) {
    _log.default.title('NLU');

    _log.default.info('Processing...');

    query = _string.default.ucfirst(query);

    if (Object.keys(this.nlp).length === 0) {
      this.brain.talk(`${this.brain.wernicke('random_errors')}!`);
      this.brain.socket.emit('is-typing', false);

      _log.default.error('The NLP model is missing, please rebuild the project or if you are in dev run: npm run train expressions');

      return false;
    }

    const lang = _langs.langs[process.env.LEON_LANG].short;
    const result = await this.nlp.process(lang, query);
    const {
      domain,
      intent,
      score
    } = result;
    const [moduleName, actionName] = intent.split('.');
    let obj = {
      query,
      entities: [],
      classification: {
        package: domain,
        module: moduleName,
        action: actionName,
        confidence: score
      }
    };
    /* istanbul ignore next */

    if (process.env.LEON_LOGGER === 'true' && process.env.LEON_NODE_ENV !== 'testing') {
      this.request.post('https://logger.getleon.ai/v1/expressions').set('X-Origin', 'leon-core').send({
        version: _package.version,
        query,
        lang,
        classification: obj.classification
      }).then(() => {
        /* */
      }).catch(() => {
        /* */
      });
    }

    if (intent === 'None') {
      const fallback = Nlu.fallback(obj, _langs.langs[process.env.LEON_LANG].fallbacks);

      if (fallback === false) {
        this.brain.talk(`${this.brain.wernicke('random_unknown_queries')}.`, true);
        this.brain.socket.emit('is-typing', false);

        _log.default.title('NLU');

        _log.default.warning('Query not found');

        return false;
      }

      obj = fallback;
    }

    _log.default.title('NLU');

    _log.default.success('Query found');

    try {
      obj.entities = await this.ner.extractEntities(lang, (0, _path.join)(__dirname, '../../../packages', obj.classification.package, `data/expressions/${lang}.json`), obj);
    } catch (e)
    /* istanbul ignore next */
    {
      _log.default[e.type](e.obj.message);

      this.brain.talk(`${this.brain.wernicke(e.code, '', e.data)}!`);
    }

    try {
      // Inject action entities with the others if there is
      await this.brain.execute(obj);
    } catch (e)
    /* istanbul ignore next */
    {
      _log.default[e.type](e.obj.message);

      this.brain.socket.emit('is-typing', false);
    }

    return true;
  }
  /**
   * Pickup and compare the right fallback
   * according to the wished module
   */


  static fallback(obj, fallbacks) {
    const words = obj.query.toLowerCase().split(' ');

    if (fallbacks.length > 0) {
      _log.default.info('Looking for fallbacks...');

      const tmpWords = [];

      for (let i = 0; i < fallbacks.length; i += 1) {
        for (let j = 0; j < fallbacks[i].words.length; j += 1) {
          if (words.includes(fallbacks[i].words[j]) === true) {
            tmpWords.push(fallbacks[i].words[j]);
          }
        }

        if (JSON.stringify(tmpWords) === JSON.stringify(fallbacks[i].words)) {
          obj.entities = [];
          obj.classification.package = fallbacks[i].package;
          obj.classification.module = fallbacks[i].module;
          obj.classification.action = fallbacks[i].action;
          obj.classification.confidence = 1;

          _log.default.success('Fallback found');

          return obj;
        }
      }
    }

    return false;
  }

}

var _default = Nlu;
exports.default = _default;