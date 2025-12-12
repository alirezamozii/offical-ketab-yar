"use client"

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { getPresetAvatarIds } from '@/lib/utils/avatar-utils';
import type { User } from '@supabase/supabase-js';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  username: z.string()
    .min(3, 'نام کاربری باید حداقل 3 کاراکتر باشد')
    .max(20, 'نام کاربری نباید بیشتر از 20 کاراکتر باشد')
    .regex(/^[a-zA-Z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و _ مجاز است')
    .nullable(),
  full_name: z.string().min(2, 'نام کامل الزامی است').nullable(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  user: User;
  profile: Profile;
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile.avatar_url || '/avatars/preset-1.svg');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const supabase = createClient();

  const presetAvatars = getPresetAvatarIds().map(id => `/avatars/preset-${id}.svg`);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: profile.username,
      full_name: profile.full_name,
    },
  });

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === profile.username) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned - username is available
        setUsernameAvailable(true);
      } else if (data) {
        // Username exists
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounce username check
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'username' && value.username) {
        const timer = setTimeout(() => {
          checkUsernameAvailability(value.username as string);
        }, 500);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (data: ProfileFormValues) => {
    // Check if username is taken
    if (usernameAvailable === false) {
      toast.error('این نام کاربری قبلاً استفاده شده است');
      return;
    }

    setIsLoading(true);

    try {
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          avatar_url: selectedAvatar,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('پروفایل با موفقیت به‌روزرسانی شد');
      router.refresh();
      router.push('/dashboard');
    } catch (error) {
      console.error('خطا در به‌روزرسانی پروفایل:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Selection */}
        <div className="space-y-4">
          <Label>انتخاب آواتار</Label>
          <div className="flex items-center gap-6">
            {/* Current Avatar Preview */}
            <Avatar className="h-24 w-24 ring-4 ring-[#D4AF37]/20">
              <AvatarImage src={selectedAvatar} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-gold-500 to-gold-600 text-white">
                {profile.full_name?.[0] || profile.username?.[0] || user.email?.[0].toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Avatar Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-6 gap-3">
                {presetAvatars.map((avatarUrl) => (
                  <button
                    key={avatarUrl}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={cn(
                      "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all hover:scale-110",
                      selectedAvatar === avatarUrl
                        ? "border-[#D4AF37] ring-4 ring-[#D4AF37]/20 scale-110"
                        : "border-transparent hover:border-[#D4AF37]/50"
                    )}
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={avatarUrl} />
                    </Avatar>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                یکی از آواتارهای پیش‌فرض را انتخاب کنید
              </p>
            </div>
          </div>
        </div>

        {/* Username Field */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام کاربری</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="username"
                    dir="ltr"
                    className="pr-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                {usernameAvailable === true && (
                  <span className="text-green-600">✓ این نام کاربری در دسترس است</span>
                )}
                {usernameAvailable === false && (
                  <span className="text-red-600">✗ این نام کاربری قبلاً استفاده شده است</span>
                )}
                {usernameAvailable === null && (
                  <span>فقط حروف انگلیسی، اعداد و _ مجاز است</span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Full Name Field */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام کامل</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="نام و نام خانوادگی" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || checkingUsername || usernameAvailable === false}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            'ذخیره تغییرات'
          )}
        </Button>
      </form>
    </Form>
  );
}
