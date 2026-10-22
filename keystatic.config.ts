import { config, fields, collection, singleton } from '@keystatic/core';
import { AdminBrandMark } from './src/components/AdminBrandMark';

export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: {
          owner: 'jsbalabat',
          name: 'portfolio',
        },
      }
    : {
        kind: 'local',
      },
  ui: {
    brand: {
      name: 'Marc Balabat — Admin',
      mark: AdminBrandMark,
    },
    navigation: {
      'Content': ['posts'],
      'Configuration': ['settings'],
    },
  },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*/',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({
          label: 'Summary / Description',
          multiline: true,
          validation: { length: { min: 20, max: 250 } },
        }),
        publishedAt: fields.date({
          label: 'Publication Date',
          defaultValue: { kind: 'today' },
        }),
        updatedAt: fields.date({
          label: 'Last Updated Date',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        coverImage: fields.image({
          label: 'Cover Image',
          directory: 'public/images/blog',
          publicPath: '/images/blog',
        }),
        coverImageAlt: fields.text({
          label: 'Cover Image Alt Text',
        }),
        featured: fields.checkbox({
          label: 'Featured on Homepage',
          defaultValue: false,
        }),
        draft: fields.checkbox({
          label: 'Draft (hide from public build)',
          defaultValue: false,
        }),
        content: fields.markdoc({
          label: 'Post Body Content',
          extension: 'md',
          options: {
            image: {
              directory: 'public/images/blog',
              publicPath: '/images/blog',
            },
          },
        }),
      },
    }),
  },
  singletons: {
    settings: singleton({
      label: 'Site & Blog Settings',
      path: 'src/content/settings',
      format: { data: 'json' },
      schema: {
        siteName: fields.text({
          label: 'Site Name',
          defaultValue: 'Marc Balabat',
        }),
        articlesTitle: fields.text({
          label: 'Articles Page Heading',
          defaultValue: 'ARTICLES',
        }),
        articlesDescription: fields.text({
          label: 'Articles Subtitle / Description',
          multiline: true,
          defaultValue: 'Architecture walkthroughs, design tradeoffs, and technical breakdowns from production systems.',
        }),
        authorName: fields.text({
          label: 'Author Name',
          defaultValue: 'Marc Balabat',
        }),
        authorRole: fields.text({
          label: 'Author Role',
          defaultValue: 'Full-Stack Software Engineer',
        }),
        githubUrl: fields.url({
          label: 'GitHub URL',
          defaultValue: 'https://github.com/jsbalabat',
        }),
        linkedinUrl: fields.url({
          label: 'LinkedIn URL',
          defaultValue: 'https://www.linkedin.com/in/marc-balabat',
        }),
      },
    }),
  },
});
