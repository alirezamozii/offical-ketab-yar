'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Search, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { ActivityFeed } from './activity-feed'
import { FindFriends } from './find-friends'
import { FriendRequests } from './friend-requests'
import { FriendsList } from './friends-list'

interface FriendsContentProps {
    userId: string
}

export function FriendsContent({ userId }: FriendsContentProps) {
    const [activeTab, setActiveTab] = useState('friends')

    return (
        <div className="container max-w-6xl py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">دوستان</h1>
                <p className="text-muted-foreground">
                    با دوستان خود ارتباط برقرار کنید و فعالیت‌های آن‌ها را دنبال کنید
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="friends" className="gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">دوستان من</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">درخواست‌ها</span>
                    </TabsTrigger>
                    <TabsTrigger value="find" className="gap-2">
                        <Search className="h-4 w-4" />
                        <span className="hidden sm:inline">جستجو</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">فعالیت‌ها</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>دوستان من</CardTitle>
                            <CardDescription>
                                لیست دوستان شما و آمار آن‌ها
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FriendsList userId={userId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>درخواست‌های دوستی</CardTitle>
                            <CardDescription>
                                درخواست‌های دوستی در انتظار پاسخ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FriendRequests userId={userId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="find" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>جستجوی کاربران</CardTitle>
                            <CardDescription>
                                کاربران جدید را پیدا کنید و به آن‌ها درخواست دوستی بدهید
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FindFriends userId={userId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>فعالیت دوستان</CardTitle>
                            <CardDescription>
                                ببینید دوستان شما چه کتاب‌هایی می‌خوانند و چه دستاوردهایی کسب می‌کنند
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityFeed userId={userId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
