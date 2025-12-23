# Photo Print JS

A JavaScript library for photo print layouts, similar to Windows Photo Printing Wizard. Arrange multiple images in various grid layouts and print them or export to PDF.

**[Live Demo](https://bangome.github.io/photo-print-js/)**

## Features

- **13 Layout Presets**: full, 2x1, 1x2, 2x2, 2x3, 3x2, 3x3, 4x4, 4x5, wallet, 3.5x5, 4x6, 5x7
- **7 Paper Sizes**: A4, A5, A3, Letter, Legal, 4x6, 5x7
- **Multiple Image Sources**: URL, File, Blob, Base64, HTMLImageElement
- **Image Fit Options**: contain, cover, fill, none
- **Live Preview**: Page navigation, zoom
- **Print**: Browser print dialog
- **Framework Agnostic**: Pure vanilla JavaScript/TypeScript

## Installation

```bash
npm install photo-print-js
```

Or with yarn/pnpm:

```bash
yarn add photo-print-js
pnpm add photo-print-js
```

### CDN

```html
<script src="https://unpkg.com/photo-print-js@0.1.0/dist/photo-print.iife.js"></script>
<script>
  const printer = new PhotoPrint.PhotoPrintLayout({ layout: '2x2' });
</script>
```

## Quick Start

```typescript
import { PhotoPrintLayout } from 'photo-print-js';

const printer = new PhotoPrintLayout({
  layout: '2x2',
  paper: { size: 'a4', margins: 10 }
});

// Add images
await printer.addImages([
  'photo1.jpg',
  'photo2.jpg',
  'photo3.jpg',
  'photo4.jpg'
]);

// Render preview
printer.renderPreview({
  container: '#preview',
  showNavigation: true
});

// Print
await printer.print();
```

## API

### Constructor Options

```typescript
const printer = new PhotoPrintLayout({
  layout: '2x2',              // Layout preset ID or custom template
  paper: {
    size: 'a4',               // Paper size ID or { width, height } in mm
    orientation: 'portrait',  // 'portrait' | 'landscape' | 'auto'
    margins: 10               // Margins in mm (number or { top, right, bottom, left })
  },
  imageSettings: {
    fit: 'cover',             // 'contain' | 'cover' | 'fill' | 'none'
    position: {
      horizontal: 'center',   // 'left' | 'center' | 'right'
      vertical: 'center'      // 'top' | 'center' | 'bottom'
    }
  },
  debug: false
});
```

### Methods

#### Image Management
- `addImage(source)` - Add single image
- `addImages(sources)` - Add multiple images
- `removeImage(id)` - Remove image by ID
- `reorderImages(fromIndex, toIndex)` - Reorder images
- `clearImages()` - Remove all images
- `getImages()` - Get all images

#### Layout
- `setLayout(layout)` - Set layout by ID or template
- `getLayout()` - Get current layout
- `getAvailableLayouts()` - Get all available layouts
- `registerLayout(template)` - Register custom layout

#### Paper
- `setPaper(settings)` - Set paper settings
- `getPaper()` - Get paper settings
- `setPaperSize(size)` - Set paper size
- `setMargins(margins)` - Set margins

#### Preview
- `renderPreview(options)` - Render preview
- `updatePreview()` - Update preview
- `destroyPreview()` - Destroy preview

#### Output
- `print()` - Open print dialog
- `toCanvas(pageIndex)` - Get page as canvas
- `toDataURL(pageIndex, format)` - Get page as data URL
- `toBlob(pageIndex, format)` - Get page as blob

#### Events
- `on(event, callback)` - Add event listener
- `off(event, callback)` - Remove event listener
- `once(event, callback)` - Add one-time listener

### Available Layouts

| ID | Name | Grid | Images/Page |
|----|------|------|-------------|
| `full` | Full Page | 1x1 | 1 |
| `2x1` | 2-up Horizontal | 2x1 | 2 |
| `1x2` | 2-up Vertical | 1x2 | 2 |
| `2x2` | 4-up Grid | 2x2 | 4 |
| `2x3` | 6-up Vertical | 2x3 | 6 |
| `3x2` | 6-up Horizontal | 3x2 | 6 |
| `3x3` | 9-up Grid | 3x3 | 9 |
| `4x4` | 16-up Grid | 4x4 | 16 |
| `4x5` | Contact Sheet | 4x5 | 20 |
| `wallet` | Wallet Size | 4x2 | 8 |

### Custom Layout

```typescript
printer.registerLayout({
  id: 'custom-collage',
  name: 'Custom Collage',
  grid: { cols: 3, rows: 3 },
  cells: [
    { x: 0, y: 0, colSpan: 2, rowSpan: 2 },  // Large image
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 }
  ],
  gap: 5
});

printer.setLayout('custom-collage');
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Run tests
npm test
```

## License

MIT
