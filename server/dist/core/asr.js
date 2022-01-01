"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ffmpeg = require("@ffmpeg-installer/ffmpeg");

var _fluentFfmpeg = _interopRequireDefault(require("fluent-ffmpeg"));

var _fs = _interopRequireDefault(require("fs"));

var _log = _interopRequireDefault(require("../helpers/log"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const audios = {
  webm: `${__dirname}/../tmp/speech.webm`,
  wav: `${__dirname}/../tmp/speech.wav`
};

class Asr {
  constructor() {
    this.blob = {};

    _log.default.title('ASR');

    _log.default.success('New instance');
  }

  static get audios() {
    return audios;
  }
  /**
   * Encode audio blob to WAVE file
   * and forward the WAVE file to the STT parser
   */


  run(blob, stt) {
    return new Promise((resolve, reject) => {
      _log.default.title('ASR');

      this.blob = blob;

      _fs.default.writeFile(audios.webm, Buffer.from(this.blob), 'binary', err => {
        if (err) {
          reject({
            type: 'error',
            obj: err
          });
          return;
        }

        const ffmpeg = new _fluentFfmpeg.default();
        ffmpeg.setFfmpegPath(_ffmpeg.path);
        /**
         * Encode WebM file to WAVE file
         * ffmpeg -i speech.webm -acodec pcm_s16le -ar 16000 -ac 1 speech.wav
         */

        ffmpeg.addInput(audios.webm).on('start', () => {
          _log.default.info('Encoding WebM file to WAVE file...');
        }).on('end', () => {
          _log.default.success('Encoding done');

          if (Object.keys(stt).length === 0) {
            reject({
              type: 'warning',
              obj: new Error('The speech recognition is not ready yet')
            });
          } else {
            stt.parse(audios.wav);
            resolve();
          }
        }).on('error', err => {
          reject({
            type: 'error',
            obj: new Error(`Encoding error ${err}`)
          });
        }).outputOptions(['-acodec pcm_s16le', '-ar 16000', '-ac 1']).output(audios.wav).run();
      });
    });
  }

}

var _default = Asr;
exports.default = _default;