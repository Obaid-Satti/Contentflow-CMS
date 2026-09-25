import { Router } from 'express';
import { uploadMediaController } from '../controllers/media.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { mediaUploadMiddleware } from '../middleware/media-upload.middleware.js';

const router = Router();

router.use(authMiddleware);
router.post('/', mediaUploadMiddleware, uploadMediaController);

export default router;
