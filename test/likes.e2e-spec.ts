import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Posts Likes (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let createdBlogId: string;
    let createdPostId: string;

    beforeAll(async () => {
        // Set environment variables for testing
        process.env.NODE_ENV = 'testing';
        process.env.IS_USER_AUTOMATICALLY_CONFIRMED = 'true';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Clear database
        await request(app.getHttpServer())
            .delete('/api/testing/all-data')
            .expect(204);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should register a user, create blog and post, then like the post', async () => {
        // 1. Register a user
        await request(app.getHttpServer())
            .post('/api/auth/registration')
            .send({
                login: 'testuser',
                password: 'password123',
                email: 'test@example.com'
            })
            .expect(204);

        // 2. Login to get auth token
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                loginOrEmail: 'testuser',
                password: 'password123'
            })
            .expect(200);

        authToken = loginResponse.body.accessToken;

        // 3. Create a blog (using basic auth)
        const blogResponse = await request(app.getHttpServer())
            .post('/api/blogs')
            .auth('admin', 'qwerty')
            .send({
                name: 'Test Blog',
                description: 'A test blog',
                websiteUrl: 'https://example.com'
            })
            .expect(201);

        createdBlogId = blogResponse.body.id;

        // 4. Create a post
        const postResponse = await request(app.getHttpServer())
            .post('/api/posts')
            .auth('admin', 'qwerty')
            .send({
                title: 'Test Post',
                shortDescription: 'A test post',
                content: 'This is test content',
                blogId: createdBlogId
            })
            .expect(201);

        createdPostId = postResponse.body.id;

        // 5. Get the post before liking (should have 0 likes)
        const postBeforeLike = await request(app.getHttpServer())
            .get(`/api/posts/${createdPostId}`)
            .expect(200);

        expect(postBeforeLike.body.extendedLikesInfo.likesCount).toBe(0);
        expect(postBeforeLike.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(postBeforeLike.body.extendedLikesInfo.myStatus).toBe('None');
        expect(postBeforeLike.body.extendedLikesInfo.newestLikes).toEqual([]);

        // 6. Like the post
        await request(app.getHttpServer())
            .put(`/api/posts/${createdPostId}/like-status`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                likeStatus: 'Like'
            })
            .expect(204);

        // 7. Get the post after liking (should have 1 like)
        const postAfterLike = await request(app.getHttpServer())
            .get(`/api/posts/${createdPostId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(postAfterLike.body.extendedLikesInfo.likesCount).toBe(1);
        expect(postAfterLike.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(postAfterLike.body.extendedLikesInfo.myStatus).toBe('Like');
        expect(postAfterLike.body.extendedLikesInfo.newestLikes).toHaveLength(1);
        expect(postAfterLike.body.extendedLikesInfo.newestLikes[0].login).toBe('testuser');
        expect(postAfterLike.body.extendedLikesInfo.newestLikes[0].userId).toBeDefined();
        expect(postAfterLike.body.extendedLikesInfo.newestLikes[0].addedAt).toBeDefined();
    });
});