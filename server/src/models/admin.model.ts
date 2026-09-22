import { db } from '../database/connection.js';

export async function findFirstAdmin() {
    return db('admins').first();
}

export async function createAdmin(
    email: string,
    passwordHash: string,
) {
    const [admin] = await db('admins')
        .insert({
            email,
            password_hash: passwordHash,
        })
        .returning(['id', 'email', 'created_at']);

    return admin;
}

export async function findAdminByEmail(email: string) {
<<<<<<< HEAD
    return db('admins')
        .where({ email })
        .first();
=======
    return db('admins').where({ email }).first();
>>>>>>> origin/main
}