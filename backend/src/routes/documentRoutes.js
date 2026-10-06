const express = require('express');
const controller = require('../controllers/documentController');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload', controller.requireUser, upload, controller.upload);
router.get('/documents', controller.requireUser, controller.list);
router.get('/documents/:id/download', controller.requireUser, controller.download);
router.use(controller.handleError);

module.exports = router;