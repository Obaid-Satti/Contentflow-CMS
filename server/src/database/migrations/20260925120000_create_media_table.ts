import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('media', (table) => {
        table.increments('id').primary();
        table.string('file_name').notNullable();
        table.string('stored_path').notNullable().unique();
        table.string('mime').notNullable();
        table.bigint('size_bytes').notNullable();
        table.text('alt_text').notNullable().defaultTo('');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.index('created_at', 'media_created_at_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('media');
}
