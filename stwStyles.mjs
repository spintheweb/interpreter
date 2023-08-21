/*!
 * Spin the Web Styles
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
*/
import express from 'express';

import { STYLES_DIR } from './stwElements/Miscellanea.mjs';

const router = express.Router();

router.use(express.static(STYLES_DIR));

export default router;
