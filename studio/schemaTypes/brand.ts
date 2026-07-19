import { defineType, defineField } from 'sanity'
import { BookmarkIcon } from '@sanity/icons/Bookmark'

export const brandType = defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  icon: BookmarkIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Brand Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logoUrl',
      title: 'Logo Image URL',
      type: 'url',
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
})
