import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('api_tokens', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('token_hash', 64).notNullable().unique();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('last_used_at').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('api_tokens');
}
