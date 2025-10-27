# Blog Post Image Structure

## Overview
Each blog post has a standardized folder structure for managing images. This keeps assets organized and makes it easy to reference images within articles.

## Folder Structure

```
blog/
├── [blog-post-name]/
│   ├── img/
│   │   ├── hero.jpg         (required)
│   │   ├── [other-images]   (optional)
│   │   └── README.md        (documentation)
│   ├── index.html
│   ├── content.md
│   └── [other-files]
```

## Required Images

### Hero Image (`img/hero.jpg`)
Every blog post should have a hero image that serves two purposes:

1. **Article Header**: Displayed as a wide banner below the byline at the top of the article
2. **Blog Card Background**: Used as the background image for the blog card on `/blog/index.html`

**Specifications**:
- Filename: `hero.jpg` (or `.png`, `.webp`)
- Recommended Size: 2100x900px (21:9 aspect ratio)
- Format: JPG for photos, PNG for graphics with transparency
- Optimization: Should be compressed for web while maintaining quality

## Implementation Details

### Breadcrumb Navigation
Every blog post includes a sticky breadcrumb navigation at the top that mirrors the file path structure. The navigation uses the same monospace font style as the `/blog/` title on the blog index page, stays fixed at the top while scrolling, and includes a subtle background blur:

```html
<!-- Breadcrumb Navigation -->
<nav style="position: sticky; top: 0; background: var(--primary-light); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border-subtle); z-index: 1000; padding: 15px 0;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 4px; font-family: 'Lucida Console', Monaco, 'Courier New', monospace; font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">
    <a href="../../index.html" style="color: inherit; text-decoration: none; transition: color 0.2s;">acko.cool</a>
    <span>/</span>
    <a href="../index.html" style="color: inherit; text-decoration: none; transition: color 0.2s;">blog</a>
    <span>/</span>
    <a href="./index.html" style="color: inherit; text-decoration: none; transition: color 0.2s;">[blog-post-name]</a>
  </div>
</nav>
```

**Example breadcrumbs**:
- Pokemon Cost blog: `acko.cool / blog / pokemon-cost`
- Worth blog: `acko.cool / blog / worth`

**Note**: The navbar persists at the top of the viewport as you scroll, providing easy navigation at all times.

### In Article (`index.html`)
```html
<!-- Hero Image -->
<div class="shared-card" style="padding: 0; overflow: hidden; aspect-ratio: 21/9;">
  <img id="hero-image" src="img/hero.jpg" alt="[Descriptive alt text]" 
       style="width: 100%; height: 100%; object-fit: cover; display: block;" />
</div>
```

### In Blog Index (`blog/index.html`)
```html
<a href="./[blog-post-name]/" class="grid-card" 
   style="background-image: linear-gradient(to bottom, rgba(252, 251, 254, 0.7), rgba(252, 251, 254, 0.95)), 
          url('./[blog-post-name]/img/hero.jpg'); 
          background-size: cover; 
          background-position: center;">
  <div class="card-subtitle">[emoji]</div>
  <div class="card-title">[Blog Post Title]</div>
</a>
```

## Additional Images

Beyond the hero image, blog posts can include:
- **Inline images**: Referenced in markdown as `![alt text](img/image-name.jpg)`
- **Chart/visualization assets**: Icons, data visualizations, etc.
- **Interactive elements**: Game icons, UI elements, etc.

## Example: Pokemon Cost Blog Post

This post demonstrates a complete image setup:

- `img/hero.jpg` - Main hero image
- `img/red-blue.png` through `img/scarlet-violet.png` - Game icons for interactive chart
- `img/README.md` - Documentation of required images

The game icons are referenced in `data.json`:
```json
{
  "game": "Red/Blue",
  "icon": "img/red-blue.png",
  ...
}
```

And displayed in `guess.js`:
```javascript
guessSvg.select('#game-icon')
  .attr('href', game.icon);
```

## Best Practices

1. **Always create an `img/` folder** for each blog post, even if you only have a hero image
2. **Add a README.md** in the `img/` folder documenting what images are needed
3. **Use descriptive filenames** (e.g., `comparison-chart.png` instead of `img1.png`)
4. **Optimize images** before committing to reduce page load times
5. **Use appropriate formats**:
   - JPG for photographs
   - PNG for graphics, charts, or images with transparency
   - WebP for better compression (with JPG/PNG fallbacks)
6. **Include alt text** for accessibility

## Migration Guide

To add images to an existing blog post:

1. Create the `img/` folder: `mkdir blog/[post-name]/img`
2. Add your hero image as `img/hero.jpg`
3. Update `blog/index.html` to add the background image style
4. Add the hero image section to your post's `index.html`
5. Document any additional images in `img/README.md`

