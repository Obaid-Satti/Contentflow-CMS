import { Router } from 'express';

import {
    getPublicEntryController,
    listPublicEntriesController,
} from '../controllers/public-content.controller.js';
import { apiTokenAuthMiddleware } from '../middleware/api-token-auth.middleware.js';

const router = Router();

router.use(apiTokenAuthMiddleware);

/**
 * @swagger
 * /api/{apiId}:
 *   get:
 *     summary: List published content entries
 *     description: Fetches a paginated, sorted, and filtered list of published entries for a content type using a public API token.
 *     tags:
 *       - Public Content
 *     security:
 *       - apiTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique API ID of the content type (e.g. articles)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to retrieve
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of entries per page (maximum 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "title:asc"
 *         description: "Sort criteria in the format field:asc or field:desc (default: updated_at:desc)"
 *     responses:
 *       200:
 *         description: Paginated content entries with expanded media relations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters or filter syntax
 *       401:
 *         description: Unauthorized - missing or invalid public API token
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Failed to retrieve content entries
 */
router.get('/:apiId', listPublicEntriesController);

/**
 * @swagger
 * /api/{apiId}/{entryId}:
 *   get:
 *     summary: Get a single content entry
 *     description: Fetches a single published content entry by its ID with expanded media relations.
 *     tags:
 *       - Public Content
 *     security:
 *       - apiTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique API ID of the content type
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content entry
 *     responses:
 *       200:
 *         description: Single entry object with expanded media relations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - missing or invalid public API token
 *       404:
 *         description: Content type or entry not found
 *       500:
 *         description: Failed to retrieve content entry
 */
router.get('/:apiId/:entryId', getPublicEntryController);

export default router;
