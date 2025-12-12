import { type SchemaTypeDefinition } from 'sanity'
import author from './author'
import blogPost from './blogPost'
import compactBook from './compactBook'
import genre from './genre'

export const schema: { types: SchemaTypeDefinition[] } = {
    types: [compactBook, author, genre, blogPost],
}

export const schemaTypes = [compactBook, author, genre, blogPost]
