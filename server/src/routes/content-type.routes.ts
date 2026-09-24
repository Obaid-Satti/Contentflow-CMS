import { Router } from 'express';

import {
    createContentTypeController,
    getContentTypesController,
    getContentTypeByIdController,
    updateContentTypeController,
    deleteContentTypeController,
} from '../controllers/content-type.controller.js';

import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     ContentTypeField:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           example: title
 *         type:
 *           type: string
 *           enum: [short_text, long_text, number, boolean, date, email, enumeration, media]
 *           example: short_text
 *         required:
 *           type: boolean
 *           example: true
 *         unique:
 *           type: boolean
 *           description: Supported for short_text and email fields
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Required for enumeration fields
 *     ContentType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Article
 *         api_id:
 *           type: string
 *           example: articles
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContentTypeField'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/content-types:
 *   post:
 *     summary: Create a new content type
 *     tags:
 *       - Content Types
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - apiId
 *               - fields
 *             properties:
 *               name:
 *                 type: string
 *                 example: Article
 *               apiId:
 *                 type: string
 *                 example: articles
 *               fields:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ContentTypeField'
 *     responses:
 *       201:
 *         description: Content type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentType'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create content type
 *   get:
 *     summary: Get all content types
 *     tags:
 *       - Content Types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all content types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContentType'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to get content types
 */
router.post('/', createContentTypeController);
router.get('/', getContentTypesController);

/**
 * @swagger
 * /api/content-types/{id}:
 *   get:
 *     summary: Get a content type by ID
 *     tags:
 *       - Content Types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content type
 *     responses:
 *       200:
 *         description: Content type details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentType'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Failed to get content type
 *   put:
 *     summary: Update an existing content type
 *     tags:
 *       - Content Types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Article
 *               apiId:
 *                 type: string
 *                 example: articles
 *               fields:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ContentTypeField'
 *     responses:
 *       200:
 *         description: Content type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentType'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Failed to update content type
 *   delete:
 *     summary: Delete a content type
 *     tags:
 *       - Content Types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content type
 *     responses:
 *       204:
 *         description: Content type deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Failed to delete content type
 */
router.get('/:id', getContentTypeByIdController);
router.put('/:id', updateContentTypeController);
router.delete('/:id', deleteContentTypeController);

export default router;
