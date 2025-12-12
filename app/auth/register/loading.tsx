import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function RegisterLoading() {
    return (
        <Card className="w-full max-w-md border-gold/30 shadow-2xl backdrop-blur-sm bg-background/95 dark:bg-background/90">
            <CardHeader className="space-y-2 text-center pb-4">
                <Skeleton className="mx-auto h-14 w-14 md:h-16 md:w-16 rounded-2xl" />
                <Skeleton className="mx-auto h-8 w-3/4" />
                <Skeleton className="mx-auto h-4 w-2/3" />
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Skeleton className="h-2 w-8 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <Skeleton className="h-px w-full" />
                    </div>
                    <div className="relative flex justify-center">
                        <Skeleton className="mx-auto h-4 w-20" />
                    </div>
                </div>
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
}
