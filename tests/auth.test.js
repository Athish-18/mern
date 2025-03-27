import request from 'supertest'
import mongoose from 'mongoose'
import app from '../server.js' // Import your Express app
import User from '../models/user.model.js' // Import User model
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer

// Before running the tests, set up an in-memory MongoDB
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
})

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
})

describe('Auth API Tests', () => {
  it('should successfully sign up a new user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(201) // Expect success status 201 (Created)
    expect(res.body).toBe('User created successfully!')

    // Verify the user exists in DB
    const user = await User.findOne({ email: 'testuser@example.com' })
    expect(user).not.toBeNull()
  })

  it('should not allow duplicate email signups', async () => {
    await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
    })

    const res = await request(app).post('/api/auth/signup').send({
      username: 'anotheruser',
      email: 'testuser@example.com',
      password: 'password456',
    })

    expect(res.status).toBe(500) // Expect error status (500 due to your catch block)
    expect(res.body.message).toBe('Error creating user')
  })

  it('should successfully sign in a registered user', async () => {
    await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
    })

    const res = await request(app).post('/api/auth/signin').send({
      email: 'testuser@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(200) // Expect success
    expect(res.body).toHaveProperty('username', 'testuser')
    expect(res.body).toHaveProperty('_id') // Expect user ID in response
  })

  it('should return error for wrong password', async () => {
    await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
    })

    const res = await request(app).post('/api/auth/signin').send({
      email: 'testuser@example.com',
      password: 'wrongpassword',
    })

    expect(res.status).toBe(401) // Expect error status
    expect(res.body.message).toBe('Wrong credentials!')
  })
})
