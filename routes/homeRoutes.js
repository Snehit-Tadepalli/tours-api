const express = require("express");
const router = express.Router();

const homePage = require("../controllers/homeController.js");

router.route(`/`).get(homePage);

module.exports = router;
