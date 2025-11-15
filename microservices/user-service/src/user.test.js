const request = require('supertest');
const app = require('./index');

describe('User Service API', () => {
    let authToken;

    beforeAll(async () => {
        // Очищаем тестовые данные
        require('./index').users = [];
    });

    test('POST /v1/users/register - успешная регистрация', async () => {
        const response = await request(app)
            .post('/v1/users/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.email).toBe('test@example.com');
    });

    test('POST /v1/users/register - повторная регистрация', async () => {
        const response = await request(app)
            .post('/v1/users/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('USER_EXISTS');
    });

    test('POST /v1/users/login - успешный вход', async () => {
        const response = await request(app)
            .post('/v1/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.user.email).toBe('test@example.com');

        authToken = response.body.data.token;
    });

    test('GET /v1/users/profile - доступ с токеном', async () => {
        const response = await request(app)
            .get('/v1/users/profile')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('test@example.com');
    });

    test('GET /v1/users/profile - доступ без токена', async () => {
        const response = await request(app)
            .get('/v1/users/profile');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
});