import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from './connection.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface MediaRecord {
    id: number;
    stored_path: string;
}

interface SampleImage {
    fileName: string;
    url: string;
    altText: string;
    publicId: string;
}

const sampleImages: SampleImage[] = [
    {
        fileName: 'technology.jpg',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
        altText: 'Technology workspace',
        publicId: 'contentflow/technology',
    },
    {
        fileName: 'business.jpg',
        url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80',
        altText: 'Business meeting',
        publicId: 'contentflow/business',
    },
    {
        fileName: 'lifestyle.jpg',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
        altText: 'Lifestyle landscape',
        publicId: 'contentflow/lifestyle',
    },
];

function configureCloudinary(): void {
    if (!process.env.CLOUDINARY_URL) {
        throw new Error('CLOUDINARY_URL is not configured.');
    }

    cloudinary.config({
        secure: true,
    });
}

async function downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to download image: ${response.status} ${response.statusText}`,
        );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length >= MAX_IMAGE_SIZE) {
        throw new Error(
            `Image exceeds the 5 MB limit: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
        );
    }

    return buffer;
}

async function uploadToCloudinary(
    buffer: Buffer,
    publicId: string,
): Promise<{
    secure_url: string;
    bytes: number;
    format: string;
}> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                resource_type: 'image',
                overwrite: true,
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error('Cloudinary upload failed.'));
                    return;
                }

                resolve({
                    secure_url: result.secure_url,
                    bytes: result.bytes,
                    format: result.format,
                });
            },
        );

        uploadStream.end(buffer);
    });
}

async function seed(): Promise<void> {
    console.log('🌱 Starting ContentFlow production seed...');

    configureCloudinary();

    try {
        /*
         * ---------------------------------------------------------
         * 1. Create / update Article content type
         * ---------------------------------------------------------
         */

        const fields = [
            {
                name: 'title',
                type: 'short_text',
                required: true,
                unique: false,
            },
            {
                name: 'content',
                type: 'long_text',
                required: true,
            },
            {
                name: 'author',
                type: 'short_text',
                required: true,
                unique: false,
            },
            {
                name: 'publishedAt',
                type: 'date',
                required: true,
            },
            {
                name: 'featured',
                type: 'boolean',
                required: true,
            },
            {
                name: 'category',
                type: 'enumeration',
                required: true,
                options: ['Technology', 'Business', 'Lifestyle'],
            },
            {
                name: 'coverImage',
                type: 'media',
                required: false,
            },
        ];

        const existingContentType = await db('content_types')
            .where({ api_id: 'articles' })
            .first();

        let contentTypeId: number;

        if (existingContentType) {
            const [updated] = await db('content_types')
                .where({ id: existingContentType.id })
                .update({
                    name: 'Article',
                    fields: JSON.stringify(fields),
                    updated_at: db.fn.now(),
                })
                .returning('*');

            contentTypeId = Number(updated.id);

            console.log('✓ Existing Article content type updated');
        } else {
            const [created] = await db('content_types')
                .insert({
                    name: 'Article',
                    api_id: 'articles',
                    fields: JSON.stringify(fields),
                })
                .returning('*');

            contentTypeId = Number(created.id);

            console.log('✓ Article content type created');
        }

        /*
         * ---------------------------------------------------------
         * 2. Remove existing Article entries
         * ---------------------------------------------------------
         */

        await db('entries')
            .where({ content_type_id: contentTypeId })
            .delete();

        console.log('✓ Existing Article entries cleared');

        /*
         * ---------------------------------------------------------
         * 3. Download Unsplash images and upload to Cloudinary
         * ---------------------------------------------------------
         */

        const mediaRecords: MediaRecord[] = [];

        for (const image of sampleImages) {
            console.log(`⬇ Downloading ${image.fileName} from Unsplash...`);

            const buffer = await downloadImage(image.url);

            console.log(
                `✓ Downloaded ${image.fileName} (${(
                    buffer.length /
                    1024 /
                    1024
                ).toFixed(2)} MB)`,
            );

            console.log(`☁ Uploading ${image.fileName} to Cloudinary...`);

            const cloudinaryAsset = await uploadToCloudinary(
                buffer,
                image.publicId,
            );

            /*
             * Cloudinary itself confirms the final asset size.
             * Check it again before registering it in our database.
             */

            if (cloudinaryAsset.bytes >= MAX_IMAGE_SIZE) {
                await cloudinary.uploader.destroy(image.publicId, {
                    resource_type: 'image',
                });

                throw new Error(
                    `Cloudinary image exceeds the 5 MB limit: ${image.fileName}`,
                );
            }

            console.log(
                `✓ Uploaded to Cloudinary (${(
                    cloudinaryAsset.bytes /
                    1024 /
                    1024
                ).toFixed(2)} MB)`,
            );

            /*
             * -------------------------------------------------------
             * Create / update media database record
             * -------------------------------------------------------
             */

            const existingMedia = await db('media')
                .where({ stored_path: cloudinaryAsset.secure_url })
                .first();

            let media: MediaRecord;

            if (existingMedia) {
                const [updatedMedia] = await db('media')
                    .where({ id: existingMedia.id })
                    .update({
                        file_name: image.fileName,
                        stored_path: cloudinaryAsset.secure_url,
                        mime: 'image/jpeg',
                        size_bytes: cloudinaryAsset.bytes,
                        alt_text: image.altText,
                    })
                    .returning('*');

                media = {
                    id: Number(updatedMedia.id),
                    stored_path: String(updatedMedia.stored_path),
                };
            } else {
                const [createdMedia] = await db('media')
                    .insert({
                        file_name: image.fileName,
                        stored_path: cloudinaryAsset.secure_url,
                        mime: 'image/jpeg',
                        size_bytes: cloudinaryAsset.bytes,
                        alt_text: image.altText,
                    })
                    .returning('*');

                media = {
                    id: Number(createdMedia.id),
                    stored_path: String(createdMedia.stored_path),
                };
            }

            mediaRecords.push(media);

            console.log(`✓ Media record saved: ${image.fileName}`);
        }

        /*
         * ---------------------------------------------------------
         * 4. Make sure media exists
         * ---------------------------------------------------------
         */

        if (mediaRecords.length === 0) {
            throw new Error('No sample media was created.');
        }

        /*
         * ---------------------------------------------------------
         * 5. Create 30 demo entries
         * ---------------------------------------------------------
         */

        const categories = [
            'Technology',
            'Business',
            'Lifestyle',
        ];

        const entries = Array.from({ length: 30 }, (_, index) => {
            const image = mediaRecords[index % mediaRecords.length]!;
            const category = categories[index % categories.length];

            return {
                content_type_id: contentTypeId,

                data: JSON.stringify({
                    title: `Demo Article ${index + 1}`,

                    content:
                        `This is sample content for demo article ${index + 1}. ` +
                        'It is seeded as part of the ContentFlow CMS demo data.',

                    author: `Author ${(index % 5) + 1}`,

                    publishedAt: `2026-${String(
                        (index % 9) + 1,
                    ).padStart(2, '0')}-${String(
                        (index % 27) + 1,
                    ).padStart(2, '0')}`,

                    featured: index % 5 === 0,

                    category,

                    /*
                     * Your frontend getMediaFileUrl() supports HTTPS URLs,
                     * so the Cloudinary URL can be stored directly here.
                     */
                    coverImage: image.stored_path,
                }),
            };
        });

        await db('entries').insert(entries);

        console.log('✓ 30 demo entries created');

        console.log('');
        console.log('🎉 Production seed completed successfully!');
        console.log('');
        console.log('Created:');
        console.log('  • 1 Article content type');
        console.log('  • 3 Cloudinary media assets');
        console.log('  • 30 demo entries');
    } catch (error) {
        console.error('❌ Production seed failed:', error);
        process.exitCode = 1;
    } finally {
        await db.destroy();
    }
}

await seed();