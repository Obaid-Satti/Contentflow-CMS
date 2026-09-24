import { Router } from 'express';

import {
    createEntryController,
    deleteEntryController,
    getEntryController,
    listEntriesController,
    updateEntryController,
} from '../controllers/entry.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * @swagger
 * /api/content-types/{contentTypeId}/entries:
 *   get:
 *     summary: List entries for a content type
 *     tags: [Content Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentTypeId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, enum: [10, 25], default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated entries and pagination metadata
 *   post:
 *     summary: Create an entry
 *     tags: [Content Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Entry created
 *       400:
 *         description: Entry data failed field validation
 *       409:
 *         description: A unique field value already exists
 */
router.get('/', listEntriesController);
router.post('/', createEntryController);

/**
 * @swagger
 * /api/content-types/{contentTypeId}/entries/{entryId}:
 *   get:
 *     summary: Get an entry
 *     tags: [Content Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentTypeId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Entry details
 *       404:
 *         description: Entry not found
 *   put:
 *     summary: Update an entry
 *     tags: [Content Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Entry updated
 *       400:
 *         description: Entry data failed field validation
 *       409:
 *         description: A unique field value already exists
 *   delete:
 *     summary: Delete an entry
 *     tags: [Content Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentTypeId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Entry deleted
 *       404:
 *         description: Entry not found
 */
router.get('/:entryId', getEntryController);
router.put('/:entryId', updateEntryController);
router.delete('/:entryId', deleteEntryController);

export default router;
