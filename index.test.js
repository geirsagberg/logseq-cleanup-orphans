import { describe, it, expect, vi } from 'vitest';
import { isPageOrphaned, findOrphanedPages } from './index.js';

describe('isPageOrphaned', () => {
  it('should return true for page with no references and no content', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = [];

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });

  it('should return true for page with no references and empty block', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = [{ content: '' }];

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });

  it('should return true for page with no references and whitespace-only block', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = [{ content: '   ' }];

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });

  it('should return false for page with content but no references', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = [{ content: 'Some content' }];

    expect(isPageOrphaned(page, references, blocks)).toBe(false);
  });

  it('should return false for page with references but no content', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [['some-page', []]];
    const blocks = [];

    expect(isPageOrphaned(page, references, blocks)).toBe(false);
  });

  it('should return false for page with both references and content', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [['some-page', []]];
    const blocks = [{ content: 'Some content' }];

    expect(isPageOrphaned(page, references, blocks)).toBe(false);
  });

  it('should return false for journal pages', () => {
    const page = { name: '2025-11-03', 'journal?': true };
    const references = [];
    const blocks = [];

    expect(isPageOrphaned(page, references, blocks)).toBe(false);
  });

  it('should return false for logseq system pages', () => {
    const page = { name: 'logseq/config', 'journal?': false };
    const references = [];
    const blocks = [];

    expect(isPageOrphaned(page, references, blocks)).toBe(false);
  });

  it('should return false for pages with multiple blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = [
      { content: 'First block' },
      { content: 'Second block' }
    ];

    expect(isPageOrphaned(page, references, blocks)).toBe(false);
  });

  it('should handle null references', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = null;
    const blocks = [];

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });

  it('should handle undefined references', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = undefined;
    const blocks = [];

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });

  it('should handle null blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = null;

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });

  it('should handle undefined blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const references = [];
    const blocks = undefined;

    expect(isPageOrphaned(page, references, blocks)).toBe(true);
  });
});

describe('findOrphanedPages', () => {
  it('should find orphaned pages', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'orphan-1', 'journal?': false },
          { name: 'orphan-2', 'journal?': false },
          { name: 'page-with-content', 'journal?': false },
          { name: 'page-with-refs', 'journal?': false }
        ]),
        getPageLinkedReferences: vi.fn((pageName) => {
          if (pageName === 'page-with-refs') {
            return Promise.resolve([['some-page', []]]);
          }
          return Promise.resolve([]);
        }),
        getPageBlocksTree: vi.fn((pageName) => {
          if (pageName === 'page-with-content') {
            return Promise.resolve([{ content: 'Some content' }]);
          }
          return Promise.resolve([]);
        })
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['orphan-1', 'orphan-2']);
    expect(mockApi.Editor.getAllPages).toHaveBeenCalledOnce();
  });

  it('should skip journal pages', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: '2025-11-03', 'journal?': true },
          { name: 'orphan-page', 'journal?': false }
        ]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([]),
        getPageBlocksTree: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['orphan-page']);
    expect(mockApi.Editor.getPageLinkedReferences).toHaveBeenCalledTimes(1);
    expect(mockApi.Editor.getPageLinkedReferences).toHaveBeenCalledWith('orphan-page');
  });

  it('should skip logseq system pages', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'logseq/config', 'journal?': false },
          { name: 'logseq/pages', 'journal?': false },
          { name: 'orphan-page', 'journal?': false }
        ]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([]),
        getPageBlocksTree: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['orphan-page']);
    expect(mockApi.Editor.getPageLinkedReferences).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no orphans found', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'page-with-content', 'journal?': false }
        ]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([]),
        getPageBlocksTree: vi.fn().mockResolvedValue([{ content: 'Content' }])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual([]);
  });

  it('should return empty array when all pages are journals', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: '2025-11-01', 'journal?': true },
          { name: '2025-11-02', 'journal?': true }
        ]),
        getPageLinkedReferences: vi.fn(),
        getPageBlocksTree: vi.fn()
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual([]);
    expect(mockApi.Editor.getPageLinkedReferences).not.toHaveBeenCalled();
    expect(mockApi.Editor.getPageBlocksTree).not.toHaveBeenCalled();
  });
});
