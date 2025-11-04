# Logseq Cleanup Orphans Plugin

Automatically remove orphaned pages from Logseq with a keyboard shortcut and toolbar button.

## Features

- **Keyboard Shortcut**: Press `Cmd+Shift+O` (Mac) or `Ctrl+Shift+O` (Windows/Linux) to trigger cleanup
- **Toolbar Button**: Click the trash icon in the toolbar for quick access
- **Smart Detection**: Identifies empty/orphaned pages that have no meaningful content
- **Safe Deletion**: Shows confirmation dialog with count before deleting
- **Excludes Special Pages**: Automatically skips journal pages and system pages (logseq/*)

## What are Orphaned Pages?

This plugin identifies "orphaned" pages using the same logic as Logseq's built-in feature. A page is considered orphaned if it meets ALL of these criteria:
- Has no linked references (no other pages or blocks link to it)
- Has no meaningful content:
  - Completely empty (no blocks)
  - Or has only a single block that is empty, whitespace, "-", or "*"
- Is not a journal page
- Is not a system page (logseq/*)

## Installation

### Development Mode

1. Clone or download this repository
2. Open Logseq and go to Settings → Advanced → Developer mode
3. Enable "Developer mode"
4. Go to Settings → Plugins → Load unpacked plugin
5. Select the `logseq-cleanup-orphans` directory

### From Marketplace (Coming Soon)

Once published to the Logseq Marketplace, you can install it directly from Settings → Plugins → Marketplace.

## Usage

### Via Keyboard Shortcut

Press `Cmd+Shift+O` (Mac) or `Ctrl+Shift+O` (Windows/Linux) to scan and remove orphaned pages.

### Via Toolbar

Click the trash icon in the Logseq toolbar to trigger the cleanup process.

### Via Command Palette

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) to open the command palette
2. Type "Cleanup: Remove orphaned pages"
3. Press Enter

## How It Works

1. The plugin scans all pages in your graph
2. For each page (excluding journal and system pages), it checks:
   - **Is the page empty?**
     - Has no blocks at all
     - Or has a single block with no meaningful content (empty, "-", "*", or whitespace)
   - **Does the page have any linked references?**
     - Checks if any other pages or blocks link to this page
3. Only pages that are both empty AND have no linked references are marked as orphaned
4. You'll see a confirmation dialog listing the first 10 orphaned pages
5. Upon confirmation, all orphaned pages are deleted

## Development

### Running Tests

The plugin includes comprehensive unit tests using Vitest.

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage
```

### Test Coverage

Tests cover:
- Orphan detection logic with various page states
- Handling of special pages (journal pages, system pages)
- Edge cases (null/undefined references and blocks)
- API mocking for isolated unit tests

## License

MIT

## Author

Geir Sagberg
