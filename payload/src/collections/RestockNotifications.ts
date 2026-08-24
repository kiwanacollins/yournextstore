import type { CollectionConfig } from 'payload'

export const RestockNotifications: CollectionConfig = {
  slug: 'restock-notifications',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'variantId', 'notifiedAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'variantId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Medusa product variant ID to notify about when back in stock.',
      },
    },
    {
      name: 'notifiedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Set when the notification email has actually been sent.',
      },
    },
  ],
}
