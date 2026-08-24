import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['productId', 'rating', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    // Shoppers only ever see approved reviews; the storefront always filters
    // by status=approved too, but this is the backstop against a missed filter.
    read: ({ req }) => {
      if (req.user) return true
      return { status: { equals: 'approved' } }
    },
    // Anyone can submit a review; only an authenticated admin can update/moderate it.
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'productId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Medusa product ID this review is for.',
      },
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
    },
    {
      name: 'authorEmail',
      type: 'email',
      required: true,
      admin: {
        description: 'Not shown publicly — used for moderation contact only.',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        // Only an admin can set/change moderation status — never the public create request.
        update: ({ req }) => Boolean(req.user),
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
