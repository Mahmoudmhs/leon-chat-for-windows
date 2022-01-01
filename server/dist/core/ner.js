"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _coreLoader = require("@nlpjs/core-loader");

var _ner = require("@nlpjs/ner");

var _builtinMicrosoft = require("@nlpjs/builtin-microsoft");

var _fs = _interopRequireDefault(require("fs"));

var _log = _interopRequireDefault(require("../helpers/log"));

var _string = _interopRequireDefault(require("../helpers/string"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @nlpjs/core is dedicated to web (browsers)
 * @nlpjs/core-loader can make use of file system
 * https://github.com/axa-group/nlp.js/issues/766#issuecomment-750315909
 */
class Ner {
  constructor() {
    this.container = (0, _coreLoader.containerBootstrap)();
    this.container.register('extract-builtin-??', new _builtinMicrosoft.BuiltinMicrosoft(), true);
    this.ner = new _ner.Ner({
      container: this.container
    });

    _log.default.title('NER');

    _log.default.success('New instance');
  }

  static logExtraction(entities) {
    entities.forEach(ent => _log.default.success(`{ value: ${ent.sourceText}, entity: ${ent.entity} }`));
  }
  /**
   * Grab entities and match them with the query
   */


  async extractEntities(lang, expressionsFilePath, obj) {
    _log.default.title('NER');

    _log.default.info('Searching for entities...');

    const {
      classification
    } = obj; // Remove end-punctuation and add an end-whitespace

    const query = `${_string.default.removeEndPunctuation(obj.query)} `;
    const expressionsObj = JSON.parse(_fs.default.readFileSync(expressionsFilePath, 'utf8'));
    const {
      module,
      action
    } = classification;
    const promises = [];
    const actionEntities = expressionsObj[module][action].entities || [];
    /**
     * Browse action entities
     * Dynamic injection of the action entities depending of the entity type
     */

    for (let i = 0; i < actionEntities.length; i += 1) {
      const entity = actionEntities[i];

      if (entity.type === 'regex') {
        promises.push(this.injectRegexEntity(lang, entity));
      } else if (entity.type === 'trim') {
        promises.push(this.injectTrimEntity(lang, entity));
      }
    }

    await Promise.all(promises);
    const {
      entities
    } = await this.ner.process({
      locale: lang,
      text: query
    }); // Trim whitespace at the beginning and the end of the entity value

    entities.map(e => {
      e.sourceText = e.sourceText.trim();
      e.utteranceText = e.utteranceText.trim();
      return e;
    });

    if (entities.length > 0) {
      Ner.logExtraction(entities);
      return entities;
    }

    _log.default.info('No entity found');

    return [];
  }
  /**
   * Inject trim type entities
   */


  injectTrimEntity(lang, entity) {
    return new Promise(resolve => {
      for (let j = 0; j < entity.conditions.length; j += 1) {
        const condition = entity.conditions[j];
        const conditionMethod = `add${_string.default.snakeToPascalCase(condition.type)}Condition`;

        if (condition.type === 'between') {
          // e.g. list.addBetweenCondition('en', 'list', 'create a', 'list')
          this.ner[conditionMethod](lang, entity.name, condition.from, condition.to);
        } else if (condition.type.indexOf('after') !== -1) {
          this.ner[conditionMethod](lang, entity.name, condition.from);
        } else if (condition.type.indexOf('before') !== -1) {
          this.ner[conditionMethod](lang, entity.name, condition.to);
        }
      }

      resolve();
    });
  }
  /**
   * Inject regex type entities
   */


  injectRegexEntity(lang, entity) {
    return new Promise(resolve => {
      this.ner.addRegexRule(lang, entity.name, new RegExp(entity.regex, 'g'));
      resolve();
    });
  }

}

var _default = Ner;
exports.default = _default;