import { Router } from 'express';

import {
    createApiTokenController,
    deleteApiTokenController,
    listApiTokensController,
} from '../controllers/api-token.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiToken:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Production Website
 *         last_used_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-09-28T04:30:00.000Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-09-28T04:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-09-28T04:00:00.000Z"
 *     CreatedApiToken:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiToken'
 *         - type: object
 *           properties:
 *             token:
 *               type: string
 *               example: cf_a1b2c3d4e5f67890abcdef1234567890
 *               description: The plaintext API token string. Shown only once upon creation.
 *     CreateApiTokenRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: Production Website
 */

/**
 * @swagger
 * /api/api-tokens:
 *   get:
 *     summary: List all API tokens
 *     description: Returns all API tokens without the sensitive token secrets.
 *     tags:
 *       - API Tokens
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API tokens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiToken'
 *       401:
 *         description: Unauthorized - missing or invalid admin JWT
 *       500:
 *         description: Failed to list API tokens
 *   post:
 *     summary: Create a new API token
 *     description: Generates a new API token for authenticating public content requests. The plaintext token key is only returned once in this response.
 *     tags:
 *       - API Tokens
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApiTokenRequest'
 *     responses:
 *       201:
 *         description: API token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatedApiToken'
 *       400:
 *         description: Invalid token name
 *       401:
 *         description: Unauthorized - missing or invalid admin JWT
 *       500:
 *         description: Failed to create API token
 */
router.post('/', createApiTokenController);
router.get('/', listApiTokensController);

/**
 * @swagger
 * /api/api-tokens/{tokenId}:
 *   delete:
 *     summary: Revoke an API token
 *     description: Permanently deletes and revokes an API token by its ID.
 *     tags:
 *       - API Tokens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the API token to delete
 *     responses:
 *       204:
 *         description: API token revoked successfully
 *       400:
 *         description: Invalid API token ID
 *       401:
 *         description: Unauthorized - missing or invalid admin JWT
 *       404:
 *         description: API token not found
 *       500:
 *         description: Failed to delete API token
 */
router.delete('/:tokenId', deleteApiTokenController);

export default router;
