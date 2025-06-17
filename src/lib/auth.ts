import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export async function signIn(email: string, password: string): Promise<User | null> {
  // In a real app, you would validate against a database
  // This is a simplified example
  if (email && password) {
    const user: User = {
      id: Math.random().toString(36).substring(7),
      email,
      name: email.split('@')[0]
    };
    
    const token = await new SignJWT(user)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(JWT_SECRET));
    
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return user;
  }
  return null;
}

export async function signOut() {
  cookies().delete('auth-token');
}

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get('auth-token')?.value;
  
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return payload as User;
  } catch (error) {
    return null;
  }
} 