'use strict';

const express = require('express');
const router = express.Router();
const rulesController = require('../controllers/rules');

/* Add endpoints */

router.get('/', rulesController.getRules);

router.post('/', rulesController.createRule);

router.delete('/:id', rulesController.deleteRule);

module.exports = router;