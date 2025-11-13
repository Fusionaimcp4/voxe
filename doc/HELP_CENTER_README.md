# Help Center Documentation

This document explains how to update and maintain the Voxe Help Center.

## Overview

The Help Center is a static documentation system built into the Voxe Next.js application. It's located at `/help` and provides users with comprehensive guides and troubleshooting information.

## Structure

### Files and Directories

```
app/help/
├── layout.tsx              # Help Center layout with banner
├── page.tsx                 # Help Center landing page
└── [category]/
    ├── page.tsx            # Category overview page
    └── [slug]/
        └── page.tsx        # Individual article page

components/help/
├── HelpSidebar.tsx         # Navigation sidebar
├── HelpSearch.tsx          # Search functionality
├── HelpFeedback.tsx        # Article feedback widget
└── Breadcrumbs.tsx         # Breadcrumb navigation

lib/
└── helpData.ts             # Static help content data

app/api/
└── help-feedback/
    └── route.ts            # Feedback submission API
```

## Adding or Updating Articles

### Method 1: Edit `lib/helpData.ts` Directly

1. Open `lib/helpData.ts`
2. Find the relevant category in the `helpCategories` array
3. Add or modify articles within that category's `articles` array

Example:

```typescript
{
  id: 'new-article-id',
  title: 'New Article Title',
  slug: 'new-article-slug',
  category: 'Category Name',
  categorySlug: 'category-slug',
  excerpt: 'Brief description of the article',
  content: `Your article content here.

You can use markdown-style formatting:
- Bullet points
- **Bold text**
- Regular paragraphs

#### Subheadings

More content...`,
}
```

### Method 2: Create New Category

To add a new category:

1. Open `lib/helpData.ts`
2. Add a new object to the `helpCategories` array:

```typescript
{
  id: 'new-category-id',
  title: 'New Category',
  slug: 'new-category',
  description: 'Description of this category',
  articles: [
    // Add articles here
  ],
}
```

## Content Guidelines

### Article Structure

- **Title**: Clear, descriptive title
- **Slug**: URL-friendly version (lowercase, hyphens)
- **Excerpt**: 1-2 sentence summary (used in search results)
- **Content**: Full article content with markdown-style formatting

### Supported Formatting

The Help Center supports basic markdown formatting:

- **Bold text**: `**text**`
- **Bullet lists**: `- item` or `* item`
- **Subheadings**: `#### Heading`
- **Paragraphs**: Regular text (separated by blank lines)

### Best Practices

1. **Keep articles focused**: Each article should cover one topic
2. **Use clear headings**: Break up long content with subheadings
3. **Include examples**: Show users exactly what to do
4. **Be concise**: Get to the point quickly
5. **Update regularly**: Keep content current with the application

## Search Functionality

The Help Center includes client-side search that searches:
- Article titles
- Article excerpts
- Article content
- Category names

Search results are limited to 5 articles and displayed in a dropdown.

## Feedback System

Users can provide feedback on articles using the "Was this article helpful?" widget at the bottom of each article.

Feedback is submitted to `/api/help-feedback` and currently logged to the console. To persist feedback:

1. Update `app/api/help-feedback/route.ts`
2. Add database integration (Prisma)
3. Or integrate with analytics service

## SEO and Metadata

Each article page includes:
- Dynamic title: `{Article Title} — Voxe Help Center`
- Meta description from article excerpt
- OpenGraph tags for social sharing
- Canonical URLs

## Styling

The Help Center uses:
- **Primary color**: Blue (`#2563EB` / `blue-600`)
- **Background**: White (light) / Slate-900 (dark)
- **Text**: Slate-700 (light) / Slate-300 (dark)
- **TailwindCSS** for all styling

## Testing

After making changes:

1. **Development**: Run `npm run dev` and navigate to `/help`
2. **Check routes**: Verify all category and article pages load
3. **Test search**: Try searching for articles
4. **Test feedback**: Submit feedback on an article
5. **Check mobile**: Verify responsive design works

## Deployment

The Help Center uses Next.js static generation:

- All pages are pre-rendered at build time
- Routes are generated from `helpData.ts`
- No database queries needed
- Fast page loads

## Removing Pricing/Tier Information

As requested, pricing and tier-specific information has been excluded from the Help Center. If you need to add tier-specific guidance:

1. Use generic language (e.g., "Check your plan limits" instead of specific numbers)
2. Link to the Pricing page for current rates
3. Reference "your subscription tier" rather than specific tiers

## Future Enhancements

Potential improvements:

- [ ] Add article tags/categories
- [ ] Related articles section
- [ ] Article versioning
- [ ] Analytics integration
- [ ] Search result highlighting
- [ ] PDF export
- [ ] Print-friendly styles
- [ ] Article rating system
- [ ] User comments/contributions

## Support

For questions about the Help Center:
- Check this README
- Review the code in `app/help/` and `components/help/`
- Contact the development team

