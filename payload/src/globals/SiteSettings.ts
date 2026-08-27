import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'storeName',
      type: 'text',
      required: true,
      defaultValue: 'Mutindo Express Cakes Kampala',
    },
    {
      name: 'storeDescription',
      type: 'textarea',
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'showBlogLink',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the Blog link in the footer. Turn on once there are published posts.',
      },
    },
    {
      name: 'showContactLink',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the Contact link in the footer.',
      },
    },
  ],
}
