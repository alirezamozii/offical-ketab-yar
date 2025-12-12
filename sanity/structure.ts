import { BookOpen, FileText, FolderTree, Users } from 'lucide-react'
import type { StructureResolver } from 'sanity/structure'

/**
 * 🎯 Sanity Studio Structure | ساختار استودیو سنیتی
 * 
 * EN: This defines the sidebar navigation and organization of your Sanity Studio.
 * FA: این فایل نوار کناری و سازماندهی استودیو سنیتی شما را تعریف می‌کند.
 * 
 * 📋 WORKFLOW | گردش کار:
 * 1️⃣ Create Genres first (ژانرها) → Categories for books
 * 2️⃣ Create Authors second (نویسندگان) → Book writers
 * 3️⃣ Create Books third (کتاب‌ها) → Main content
 * 4️⃣ Create Blog Posts last (پست‌های بلاگ) → Marketing content
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('کتاب‌یار | Ketab-Yar CMS')
    .items([
      // ============================================
      // SECTION 1: CONTENT MANAGEMENT | مدیریت محتوا
      // ============================================
      S.listItem()
        .title('📚 مدیریت محتوا | Content Management')
        .icon(BookOpen)
        .child(
          S.list()
            .title('محتوا | Content')
            .items([
              // Step 1: Genres (Create these first)
              S.listItem()
                .title('1️⃣ ژانرها | Genres')
                .icon(FolderTree)
                .child(
                  S.documentTypeList('genre')
                    .title('ژانرهای کتاب | Book Genres')
                    .child((documentId) => S.document().documentId(documentId).schemaType('genre'))
                )
                .schemaType('genre'),

              // Step 2: Authors (Create these second)
              S.listItem()
                .title('2️⃣ نویسندگان | Authors')
                .icon(Users)
                .child(
                  S.documentTypeList('author')
                    .title('نویسندگان کتاب | Book Authors')
                    .child((documentId) => S.document().documentId(documentId).schemaType('author'))
                )
                .schemaType('author'),

              S.divider(),

              // Step 3: Books (Create these third)
              S.listItem()
                .title('3️⃣ کتاب‌ها | Books')
                .icon(BookOpen)
                .child(
                  S.list()
                    .title('کتاب‌ها | Books')
                    .items([
                      // All Books
                      S.listItem()
                        .title('📖 همه کتاب‌ها | All Books')
                        .icon(BookOpen)
                        .child(
                          S.documentTypeList('compactBook')
                            .title('همه کتاب‌ها | All Books')
                            .filter('_type == "compactBook"')
                            .child((documentId) => S.document().documentId(documentId).schemaType('compactBook'))
                        ),

                      S.divider(),

                      // Published Books
                      S.listItem()
                        .title('✅ منتشر شده | Published')
                        .child(
                          S.documentTypeList('compactBook')
                            .title('کتاب‌های منتشر شده | Published Books')
                            .filter('_type == "compactBook" && status == "published"')
                        ),

                      // Draft Books
                      S.listItem()
                        .title('📝 پیش‌نویس | Draft')
                        .child(
                          S.documentTypeList('compactBook')
                            .title('کتاب‌های پیش‌نویس | Draft Books')
                            .filter('_type == "compactBook" && status == "draft"')
                        ),
                    ])
                )
                .schemaType('compactBook'),

              S.divider(),

              // Step 4: Blog Posts
              S.listItem()
                .title('4️⃣ بلاگ | Blog Posts')
                .icon(FileText)
                .child(
                  S.list()
                    .title('بلاگ | Blog')
                    .items([
                      // All Posts
                      S.listItem()
                        .title('📰 همه پست‌ها | All Posts')
                        .child(
                          S.documentTypeList('blogPost')
                            .title('همه پست‌های بلاگ | All Blog Posts')
                            .filter('_type == "blogPost"')
                        ),

                      S.divider(),

                      // Published Posts
                      S.listItem()
                        .title('✅ منتشر شده | Published')
                        .child(
                          S.documentTypeList('blogPost')
                            .title('پست‌های منتشر شده | Published Posts')
                            .filter('_type == "blogPost" && status == "published"')
                        ),

                      // Draft Posts
                      S.listItem()
                        .title('📝 پیش‌نویس | Draft')
                        .child(
                          S.documentTypeList('blogPost')
                            .title('پست‌های پیش‌نویس | Draft Posts')
                            .filter('_type == "blogPost" && status == "draft"')
                        ),
                    ])
                )
                .schemaType('blogPost'),
            ])
        ),

    ])
