import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("content_types", (table) => {
        table.increments("id").primary();

        table.string("name").notNullable();

        table.string("api_id").notNullable().unique();

        table.jsonb("fields").notNullable().defaultTo("[]");

        table
            .timestamp("created_at")
            .notNullable()
            .defaultTo(knex.fn.now());

        table
            .timestamp("updated_at")
            .notNullable()
            .defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("content_types");
}