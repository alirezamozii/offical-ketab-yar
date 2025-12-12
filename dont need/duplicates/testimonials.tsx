'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

const testimonials = [
    {
        name: 'علی احمدی',
        role: 'دانشجوی زبان انگلیسی',
        avatar: '/avatars/user-1.jpg',
        rating: 5,
        text: 'کتاب‌یار تجربه یادگیری من را کاملاً متحول کرد. با خواندن کتاب‌های دوزبانه، واژگانم 3 برابر شد!',
    },
    {
        name: 'سارا محمدی',
        role: 'مترجم',
        avatar: '/avatars/user-2.jpg',
        rating: 5,
        text: 'دستیار هوش مصنوعی فوق‌العاده است. مثل یک معلم خصوصی همیشه در دسترس. ارزش هر ریالش را دارد.',
    },
    {
        name: 'رضا کریمی',
        role: 'مدیر محصول',
        avatar: '/avatars/user-3.jpg',
        rating: 5,
        text: 'بهترین سرمایه‌گذاری برای یادگیری زبان. در 3 ماه، 15 کتاب خواندم و نمره آیلتسم از 6 به 7.5 رسید!',
    },
]

export function Testimonials() {
    return (
        <div className="py-20 bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        کاربران ما چه می‌گویند؟
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        بیش از 10,000 کاربر راضی از کتاب‌یار
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-6 h-full relative overflow-hidden group hover:shadow-xl hover:shadow-gold-500/10 transition-all duration-300">
                                {/* Quote Icon */}
                                <Quote className="absolute top-4 left-4 h-12 w-12 text-gold-500/10 group-hover:text-gold-500/20 transition-colors" />

                                {/* Rating */}
                                <div className="flex gap-1 mb-4 relative z-10">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
                                    ))}
                                </div>

                                {/* Testimonial Text */}
                                <p className="text-foreground mb-6 leading-relaxed relative z-10">
                                    "{testimonial.text}"
                                </p>

                                {/* User Info */}
                                <div className="flex items-center gap-3 relative z-10">
                                    <Avatar className="h-12 w-12 border-2 border-gold-500/20">
                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                        <AvatarFallback className="bg-gold-500/10 text-gold-600">
                                            {testimonial.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-right">
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
