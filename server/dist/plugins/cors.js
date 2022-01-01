"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const corsMidd = async (_request, reply) => {
  // Allow only a specific client to request to the API (depending of the env)
  if (process.env.LEON_NODE_ENV !== 'production') {
    reply.header('Access-Control-Allow-Origin', `${process.env.LEON_HOST}:3000`);
  } // Allow several headers for our requests


  reply.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  reply.header('Access-Control-Allow-Credentials', true);
};

var _default = corsMidd;
exports.default = _default;