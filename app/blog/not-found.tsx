import { Button } from '@/components/ui/button'
import { BookOpen, FileQuestion, Home, Newspaper } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

const metadata: Metadata = {
  title: 'Blog Post Not Found | Ketab-Yar',
  description: 'The blog post you are looking for could not be found.',
}

export default function BlogNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-gold/5 px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative">
              <FileQuestion className="w-32 h-32 md:w-40 md:h-40 text-gold" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-600">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            Blog Post Not Found
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            This blog post doesn't exist or may have been removed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-600 delay-200">
          <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-white min-w-[200px]">
            <Link href="/blog">
              <Newspaper className="mr-2 h-5 w-5" />
              View All Posts
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="min-w-[200px]">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Helpful Info */}
        <div className="pt-8 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-800 delay-300">
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 max-w-md mx-auto">
            <BookOpen className="w-8 h-8 text-gold mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Looking for reading tips and book recommendations? Check out our latest blog posts!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
