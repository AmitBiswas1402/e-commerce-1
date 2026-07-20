import { defineType, defineField } from 'sanity'
import { StarIcon } from '@sanity/icons/Star'

export const reviewType = defineType({
  name: 'review',
  title: 'Customer Review',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'userName',
      title: 'User Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'userEmail',
      title: 'User Email',
      type: 'string',
    }),
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Rating (1 to 5)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: 'title',
      title: 'Review Title',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Review Content',
      type: 'text',
    }),
    defineField({
      name: 'isVerifiedPurchase',
      title: 'Is Verified Purchase',
      type: 'boolean',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
  ],
})
