import bcrypt from 'bcrypt';
import { User, InsertUser, LoginRequest, RegisterRequest } from '@shared/schema';
import { storage } from '../storage';

export class AuthService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async register(userData: RegisterRequest): Promise<User> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Create user
    const newUser: InsertUser = {
      email: userData.email,
      password_hash: passwordHash,
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      profile_photo: null,
      preferred_avatar_id: null,
      onboarding_completed: false,
    };

    return await storage.createUser(newUser);
  }

  async login(credentials: LoginRequest): Promise<User> {
    // Find user by email
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await this.comparePassword(credentials.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    return await storage.getUserById(id);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    return await storage.updateUser(id, updates);
  }
}

export const authService = new AuthService();