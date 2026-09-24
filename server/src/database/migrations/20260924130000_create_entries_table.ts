import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('entries', (table) => {
        table.increments('id').primary();

        table
            .integer('content_type_id')
            .notNullable()
            .references('id')
            .inTable('content_types')
            .onDelete('CASCADE');

        table.jsonb('data').notNullable().defaultTo('{}');

        table
            .timestamp('created_at')
            .notNullable()
            .defaultTo(knex.fn.now());

        table
            .timestamp('updated_at')
            .notNullable()
            .defaultTo(knex.fn.now());

        table.index('content_type_id', 'entries_content_type_id_index');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('entries');
}
