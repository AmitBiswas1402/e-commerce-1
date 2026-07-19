import { defineType, defineField, defineArrayMember } from 'sanity'
import { PackageIcon } from '@sanity/icons/Package'

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
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
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'reference',
      to: [{ type: 'brand' }],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'DRAFT' },
          { title: 'Published', value: 'PUBLISHED' },
          { title: 'Archived', value: 'ARCHIVED' },
        ],
        layout: 'radio',
      },
      initialValue: 'DRAFT',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isFeatured',
      title: 'Is Featured Product',
      type: 'boolean',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isNewArrival',
      title: 'Is New Arrival',
      type: 'boolean',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'productImage',
          title: 'Product Image',
          fields: [
            defineField({
              name: 'imageUrl',
              title: 'Image URL',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'altText',
              title: 'Alt Text',
              type: 'string',
            }),
            defineField({
              name: 'sortOrder',
              title: 'Sort Order',
              type: 'number',
              initialValue: 0,
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'variants',
      title: 'Product Variants',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'productVariant',
          title: 'Product Variant',
          fields: [
            defineField({
              name: 'sku',
              title: 'SKU',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'color',
              title: 'Color',
              type: 'string',
            }),
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
            }),
            defineField({
              name: 'price',
              title: 'Price (in Paise/Cents or Cents equivalent)',
              type: 'number',
              description: 'Stored as integer (e.g. 9999 for 99.99)',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'compareAtPrice',
              title: 'Compare At Price (Original price before discount)',
              type: 'number',
              description: 'Stored as integer (e.g. 14999 for 149.99)',
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: 'stock',
              title: 'Stock Quantity',
              type: 'number',
              initialValue: 0,
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'isActive',
              title: 'Is Active Variant',
              type: 'boolean',
              initialValue: true,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
  ],
})
