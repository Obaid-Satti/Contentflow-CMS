import { Router } from 'express';

import {
    createApiTokenController,
    deleteApiTokenController,
    listApiTokensController,
} from '../controllers/api-token.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.post('/', createApiTokenController);
router.get('/', listApiTokensController);
router.delete('/:tokenId', deleteApiTokenController);

export default router;
