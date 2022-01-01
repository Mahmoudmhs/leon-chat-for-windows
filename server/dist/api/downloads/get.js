"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _archiver = _interopRequireDefault(require("archiver"));

var _log = _interopRequireDefault(require("../../helpers/log"));

var _string = _interopRequireDefault(require("../../helpers/string"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getDownloads = async (fastify, options) => {
  fastify.get(`/${options.apiVersion}/downloads`, (request, reply) => {
    _log.default.title('GET /downloads');

    const clean = (dir, files) => {
      _log.default.info('Cleaning module download directory...');

      for (let i = 0; i < files.length; i += 1) {
        _fs.default.unlinkSync(`${dir}/${files[i]}`);
      }

      _fs.default.rmdirSync(dir);

      _log.default.success('Downloads directory cleaned');
    };

    let message = '';

    if (request.query.package && request.query.module) {
      const packageDir = `${__dirname}/../../../../packages/${request.query.package}`;
      const dlPackageDir = `${__dirname}/../../../../downloads/${request.query.package}`;
      const module = `${packageDir}/${request.query.module}.py`;

      _log.default.info(`Checking existence of the ${_string.default.ucfirst(request.query.module)} module...`);

      if (_fs.default.existsSync(module)) {
        _log.default.success(`${_string.default.ucfirst(request.query.module)} module exists`);

        const downloadsDir = `${dlPackageDir}/${request.query.module}`;

        _log.default.info('Reading downloads directory...');

        _fs.default.readdir(downloadsDir, (err, files) => {
          if (err && err.code === 'ENOENT') {
            message = 'There is no content to download for this module.';

            _log.default.error(message);

            reply.code(404).send({
              success: false,
              status: 404,
              code: 'module_dir_not_found',
              message
            });
          } else {
            if (err) _log.default.error(err); // Download the file if there is only one

            if (files.length === 1) {
              _log.default.info(`${files[0]} is downloading...`);

              reply.download(`${downloadsDir}/${files[0]}`);

              _log.default.success(`${files[0]} downloaded`);

              clean(downloadsDir, files);
            } else {
              _log.default.info('Deleting previous archives...');

              const zipSlug = `leon-${request.query.package}-${request.query.module}`;

              const pkgFiles = _fs.default.readdirSync(dlPackageDir);

              for (let i = 0; i < pkgFiles.length; i += 1) {
                if (pkgFiles[i].indexOf('.zip') !== -1 && pkgFiles[i].indexOf(zipSlug) !== -1) {
                  _fs.default.unlinkSync(`${dlPackageDir}/${pkgFiles[i]}`);

                  _log.default.success(`${pkgFiles[i]} archive deleted`);
                }
              }

              _log.default.info('Preparing new archive...');

              const zipName = `${zipSlug}-${Date.now()}.zip`;
              const zipFile = `${dlPackageDir}/${zipName}`;

              const output = _fs.default.createWriteStream(zipFile);

              const archive = (0, _archiver.default)('zip', {
                zlib: {
                  level: 9
                }
              }); // When the archive is ready

              output.on('close', () => {
                _log.default.info(`${zipName} is downloading...`);

                reply.download(zipFile, err => {
                  if (err) _log.default.error(err);

                  _log.default.success(`${zipName} downloaded`);

                  clean(downloadsDir, files);
                });
              });
              archive.on('error', err => {
                _log.default.error(err);
              }); // Add the content to the archive

              _log.default.info('Adding content...');

              archive.directory(downloadsDir, false); // Inject stream data to the archive

              _log.default.info('Injecting stream data...');

              archive.pipe(output);

              _log.default.info('Finalizing...');

              archive.finalize();
            }
          }
        });
      } else {
        message = 'This module does not exist.';

        _log.default.error(message);

        reply.code(404).send({
          success: false,
          status: 404,
          code: 'module_not_found',
          message
        });
      }
    } else {
      message = 'Bad request.';

      _log.default.error(message);

      reply.code(400).send({
        success: false,
        status: 400,
        code: 'bad_request',
        message
      });
    }
  });
};

var _default = getDownloads;
exports.default = _default;