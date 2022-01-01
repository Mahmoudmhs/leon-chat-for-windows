"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _googleapis = require("googleapis");

var _fs = _interopRequireDefault(require("fs"));

var _async = require("async");

var _log = _interopRequireDefault(require("../helpers/log"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Synchronizer {
  constructor(brain, classification, sync) {
    this.brain = brain;
    this.classification = classification;
    this.sync = sync;
    this.downloadDir = `${__dirname}/../../../downloads/${this.classification.package}/${this.classification.module}`;

    _log.default.title('Synchronizer');

    _log.default.success('New instance');
  }
  /**
   * Choose the right method to synchronize
   */


  async synchronize(cb) {
    let expression = 'synced_direct';
    this.brain.talk(`${this.brain.wernicke('synchronizer', `syncing_${this.sync.method.toLowerCase().replace('-', '_')}`)}.`);
    this.brain.socket.emit('is-typing', false);

    if (this.sync.method === 'google-drive') {
      expression = 'synced_google_drive';
      await this.googleDrive();
    } else {
      await this.direct();
    }

    return cb(`${this.brain.wernicke('synchronizer', expression)}.`);
  }
  /**
   * Direct synchronization method
   */


  direct() {
    return new Promise(resolve => {
      this.brain.socket.emit('download', {
        package: this.classification.package,
        module: this.classification.module,
        action: this.classification.action
      });
      resolve();
    });
  }
  /**
   * Google Drive synchronization method
   */


  googleDrive() {
    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
      const driveFolderName = `leon-${this.classification.package}-${this.classification.module}`;
      const folderMimeType = 'application/vnd.google-apps.folder';

      const entities = _fs.default.readdirSync(this.downloadDir);

      const key = JSON.parse(_fs.default.readFileSync(`${__dirname}/../config/synchronizer/google-drive.json`, 'utf8'));
      const authClient = new _googleapis.google.auth.JWT(key.client_email, key, key.private_key, // Available scopes: https://developers.google.com/identity/protocols/googlescopes
      ['https://www.googleapis.com/auth/drive'], null);

      const drive = _googleapis.google.drive({
        version: 'v3',
        auth: authClient
      });

      let folderId = '';
      (0, _async.waterfall)([cb => {
        drive.files.list({}, (err, list) => {
          if (err) {
            _log.default.error(`Error during listing: ${err}`);

            return reject(err);
          }

          cb(null, list);
          return true;
        });
      }, (list, cb) => {
        if (list.data.files.length === 0) {
          return cb(null, false, folderId);
        } // Browse entities


        for (let i = 0; i < list.data.files.length; i += 1) {
          // In case the module folder exists
          if (list.data.files[i].mimeType === folderMimeType && list.data.files[i].name === driveFolderName) {
            folderId = list.data.files[i].id;
            return cb(null, true, folderId);
          } else if (i + 1 === list.data.files.length) {
            // eslint-disable-line no-else-return
            return cb(null, false, folderId);
          } // TODO: UI toolbox to reach this scope
          // Delete Drive files

          /* setTimeout(() => {
            drive.files.delete({ fileId: list.data.files[i].id })
            log.title('Synchronizer'); log.success(`"${list.data.files[i].id}" deleted`)
          }, 200 * i) */

        }

        return false;
      }, (folderExists, folderId, cb) => {
        if (folderExists === false) {
          // Create the module folder if it does not exist
          drive.files.create({
            resource: {
              name: driveFolderName,
              mimeType: folderMimeType
            },
            fields: 'id'
          }, (err, folder) => {
            if (err) {
              _log.default.error(`Error during the folder creation: ${err}`);

              return reject(err);
            }

            folderId = folder.data.id;

            _log.default.title('Synchronizer');

            _log.default.success(`"${driveFolderName}" folder created on Google Drive`); // Give ownership


            return drive.permissions.create({
              resource: {
                type: 'user',
                role: 'owner',
                emailAddress: this.sync.email
              },
              emailMessage: 'Hey, I created a new folder to wrap your new content, cheers. Leon.',
              transferOwnership: true,
              fileId: folderId
            }, err => {
              if (err) {
                _log.default.error(`Error during the folder permission creation: ${err}`);

                return reject(err);
              }

              _log.default.success(`"${driveFolderName}" ownership transferred`);

              cb(null, folderId);
              return true;
            });
          });
        } else {
          return cb(null, folderId);
        }

        return false;
      }, (folderId, cb) => {
        let iEntities = 0;

        const upload = i => {
          drive.files.create({
            resource: {
              name: entities[i],
              parents: [folderId]
            },
            media: {
              body: _fs.default.createReadStream(`${this.downloadDir}/${entities[i]}`)
            },
            fields: 'id'
          }, err => {
            if (err) {
              _log.default.error(`Error during the "${entities[i]}" file creation: ${err}`);

              return reject(err);
            }

            iEntities += 1;

            _log.default.title('Synchronizer');

            _log.default.success(`"${entities[i]}" file added to Google Drive`);

            if (iEntities === entities.length) {
              cb(null);
            }

            return true;
          });
        }; // Browse entities in Leon's memory


        for (let i = 0; i < entities.length; i += 1) {
          // Upload file to Drive
          upload(i);
        }
      }], err => {
        if (err) {
          _log.default.error(err);

          return reject(err);
        } // Content available on Google Drive


        resolve();
        return true;
      });
    });
  }

}

var _default = Synchronizer;
exports.default = _default;