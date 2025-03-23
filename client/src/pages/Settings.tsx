import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CircleDollarSign,
  BellIcon, 
  ShieldIcon, 
  UserIcon, 
  WalletIcon,
  SaveIcon,
} from 'lucide-react';
import { Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const userSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  currency: z.string().min(1, 'Please select a currency.'),
  theme: z.string().min(1, 'Please select a theme.'),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  transactionAlerts: z.boolean(),
  weeklyReports: z.boolean(),
  savingsOpportunities: z.boolean(),
  budgetAlerts: z.boolean(),
});

type UserSettingsValues = z.infer<typeof userSettingsSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // User settings form
  const userSettingsForm = useForm<UserSettingsValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      currency: 'USD',
      theme: 'light',
    },
  });

  // Notification settings form
  const notificationSettingsForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      transactionAlerts: true,
      weeklyReports: true,
      savingsOpportunities: true,
      budgetAlerts: false,
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserSettingsValues) => {
      // In a real application, this would call the API
      // For now, just simulate success
      return new Promise((resolve) => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your profile settings have been successfully updated.',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating settings',
        description: error.message || 'An error occurred updating your settings.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettingsValues) => {
      // In a real application, this would call the API
      // For now, just simulate success
      return new Promise((resolve) => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved.',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating settings',
        description: error.message || 'An error occurred updating your settings.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const onUserSettingsSubmit = (values: UserSettingsValues) => {
    updateUserMutation.mutate(values);
  };

  const onNotificationSettingsSubmit = (values: NotificationSettingsValues) => {
    updateNotificationsMutation.mutate(values);
  };

  return (
    <>
      <Header
        title="Settings"
        subtitle="Customize your account preferences and application settings"
      />

      <div className="px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <UserIcon className="mr-2 h-5 w-5" />
                Profile & Preferences
              </h3>

              <Form {...userSettingsForm}>
                <form onSubmit={userSettingsForm.handleSubmit(onUserSettingsSubmit)} className="space-y-6">
                  <FormField
                    control={userSettingsForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userSettingsForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormDescription>
                          Used for notifications and account recovery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <h3 className="text-lg font-semibold mt-4 mb-4 flex items-center">
                    <WalletIcon className="mr-2 h-5 w-5" />
                    Financial Settings
                  </h3>

                  <FormField
                    control={userSettingsForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                            <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                            <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <h3 className="text-lg font-semibold mt-4 mb-4 flex items-center">
                    <CircleDollarSign className="mr-2 h-5 w-5" />
                    Appearance
                  </h3>

                  <FormField
                    control={userSettingsForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full md:w-auto" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <BellIcon className="mr-2 h-5 w-5" />
                Notification Preferences
              </h3>

              <Form {...notificationSettingsForm}>
                <form
                  onSubmit={notificationSettingsForm.handleSubmit(onNotificationSettingsSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={notificationSettingsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications via email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationSettingsForm.control}
                    name="transactionAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Transaction Alerts</FormLabel>
                          <FormDescription>
                            Get notified about new transactions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationSettingsForm.control}
                    name="weeklyReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Weekly Reports</FormLabel>
                          <FormDescription>
                            Receive weekly spending summaries
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationSettingsForm.control}
                    name="savingsOpportunities"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Savings Opportunities</FormLabel>
                          <FormDescription>
                            Get alerts about potential savings
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationSettingsForm.control}
                    name="budgetAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Budget Alerts</FormLabel>
                          <FormDescription>
                            Get notified when approaching budget limits
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full md:w-auto" disabled={updateNotificationsMutation.isPending}>
                    {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Categories Settings */}
          <TabsContent value="categories">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <ShieldIcon className="mr-2 h-5 w-5" />
                Manage Categories
              </h3>

              <div className="space-y-4">
                <p className="text-gray-500">
                  Customize your transaction categories to better organize your finances.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {categories?.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="mt-6">
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Add New Category
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
