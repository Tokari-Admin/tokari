import { cookies } from 'next/headers';

export interface StorageData {
  [key: string]: any;
}

export async function saveData(key: string, data: any): Promise<void> {
  const storage = cookies().get('app-storage')?.value;
  let storageData: StorageData = {};
  
  if (storage) {
    try {
      storageData = JSON.parse(storage);
    } catch (error) {
      console.error('Error parsing storage data:', error);
    }
  }
  
  storageData[key] = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  cookies().set('app-storage', JSON.stringify(storageData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}

export async function getData(key: string): Promise<any> {
  const storage = cookies().get('app-storage')?.value;
  
  if (!storage) return null;
  
  try {
    const storageData: StorageData = JSON.parse(storage);
    return storageData[key];
  } catch (error) {
    console.error('Error parsing storage data:', error);
    return null;
  }
}

export async function deleteData(key: string): Promise<void> {
  const storage = cookies().get('app-storage')?.value;
  
  if (!storage) return;
  
  try {
    const storageData: StorageData = JSON.parse(storage);
    delete storageData[key];
    
    cookies().set('app-storage', JSON.stringify(storageData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
  } catch (error) {
    console.error('Error parsing storage data:', error);
  }
} 