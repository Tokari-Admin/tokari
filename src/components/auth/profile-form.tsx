'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").optional(),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email address."),
  currentPasswordForEmail: z.string().min(1, "Current password is required to change email."),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  currentPasswordForPassword: z.string().min(1, "Current password is required to change password."),
});

export function ProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState({ profile: false, email: false, password: false });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || '',
      currentPasswordForEmail: '',
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      currentPasswordForPassword: '',
    },
  });

  // Update defaultValues when user data is available
  useState(() => {
    if (user) {
      profileForm.reset({ displayName: user.displayName || '' });
      emailForm.reset({ email: user.email || '', currentPasswordForEmail: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profileForm, emailForm]);

  const reauthenticate = async (password: string) => {
    if (!user || !user.email) throw new Error("User not found or email missing.");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, profile: true }));
    try {
      await updateProfile(user, { displayName: values.displayName });
      toast({ title: 'Profile Updated', description: 'Your display name has been updated.' });
      profileForm.reset({ displayName: user.displayName || ''}); // refresh form with new value
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  }

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, email: true }));
    try {
      await reauthenticate(values.currentPasswordForEmail);
      await updateEmail(user, values.email);
      toast({ title: 'Email Updated', description: 'Your email has been updated. Please verify your new email if prompted.' });
      emailForm.reset({ email: user.email || '', currentPasswordForEmail: '' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Email Update Failed', description: error.message });
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }));
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, password: true }));
    try {
      await reauthenticate(values.currentPasswordForPassword);
      await updatePassword(user, values.newPassword);
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      passwordForm.reset({ newPassword: '', currentPasswordForPassword: '' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Password Update Failed', description: error.message });
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  }
  
  if (authLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <p className="text-center text-muted-foreground p-8">Please log in to view your profile.</p>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile Information</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading.profile}>
                {isLoading.profile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Change Email</CardTitle>
          <CardDescription>Update your login email address. This requires re-authentication.</CardDescription>
        </CardHeader>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <CardContent className="space-y-4">
               <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="yournew@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="currentPasswordForEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading.email}>
                {isLoading.email && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Change Password</CardTitle>
          <CardDescription>Update your login password. This requires re-authentication.</CardDescription>
        </CardHeader>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="currentPasswordForPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading.password}>
                {isLoading.password && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
