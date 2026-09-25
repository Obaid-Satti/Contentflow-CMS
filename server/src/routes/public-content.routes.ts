import { Router } from 'express';

import {
    getPublicEntryController,
    listPublicEntriesController,
} from '../controllers/public-content.controller.js';
import { apiTokenAuthMiddleware } from '../middleware/api-token-auth.middleware.js';

const router = Router();

router.use(apiTokenAuthMiddleware);
router.get('/:apiId', listPublicEntriesController);
router.get('/:apiId/:entryId', getPublicEntryController);

export default router;
