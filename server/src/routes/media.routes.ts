import { Router } from 'express';
import {
    deleteMediaController,
    createMediaUploadSignatureController,
    listMediaController,
    registerCloudinaryMediaController,
    updateMediaAltTextController,
} from '../controllers/media.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

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

router.post('/upload-signature', createMediaUploadSignatureController);
router.post('/register-upload', registerCloudinaryMediaController);

/**
 * @swagger
 * /api/media/{mediaId}/alt-text:
 *   patch:
 *     summary: Update an image's alt text
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alt_text]
 *             properties:
 *               alt_text:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Image alt text updated
 *       400:
 *         description: Invalid alt text or media is not an image
 *       404:
 *         description: Media file not found
 */
router.patch('/:mediaId/alt-text', updateMediaAltTextController);

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
