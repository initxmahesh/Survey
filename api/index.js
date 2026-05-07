const dotenv = require("dotenv");
const { createApp } = require("../server/src/app");

dotenv.config();

const app = createApp();

module.exports = (req, res) => app(req, res);
