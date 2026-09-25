import { Router } from 'express';
import {
    deleteMediaController,
    listMediaController,
    uploadMediaController,
} from '../controllers/media.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { mediaUploadMiddleware } from '../middleware/media-upload.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: List uploaded media files
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Media records with URLs for opening the stored files
 *       401:
 *         description: Unauthorized
 */
router.get('/', listMediaController);

/**
 * @swagger
 * /api/media:
 *   post:
 *     summary: Upload a media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded and media metadata stored
 *       400:
 *         description: Missing file or unsupported file type
 *       413:
 *         description: File exceeds the 5 MB limit
 *       401:
 *         description: Unauthorized
 */
router.post('/', mediaUploadMiddleware, uploadMediaController);

/**
 * @swagger
 * /api/media/{mediaId}:
 *   delete:
 *     summary: Delete a media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File deleted and entry references cleared
 *       400:
 *         description: Invalid media ID
 *       404:
 *         description: Media file not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:mediaId', deleteMediaController);

export default router;
