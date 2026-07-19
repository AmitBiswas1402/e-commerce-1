import { defineType, defineField } from 'sanity'
import { UserIcon } from '@sanity/icons/User'

export const userType = defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'clerkId',
      title: 'Clerk User ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
    }),
    defineField({
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Profile Image URL',
      type: 'url',
    }),
    defineField({
      name: 'role',
      title: 'User Role',
      type: 'string',
      options: {
        list: [
          { title: 'Customer', value: 'CUSTOMER' },
          { title: 'Admin', value: 'ADMIN' },
        ],
        layout: 'radio',
      },
      initialValue: 'CUSTOMER',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
