import { describe, it, expect, vi } from 'vitest';
import { isPageEmpty, hasNoLinkedReferences, findOrphanedPages } from './index.js';

describe('isPageEmpty', () => {
  it('should return true for page with no blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [];

    expect(isPageEmpty(page, blocks)).toBe(true);
  });

  it('should return true for page with empty block', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [{ content: '' }];

    expect(isPageEmpty(page, blocks)).toBe(true);
  });

  it('should return true for page with whitespace-only block', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [{ content: '   ' }];

    expect(isPageEmpty(page, blocks)).toBe(true);
  });

  it('should return true for page with dash-only block', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [{ content: '-' }];

    expect(isPageEmpty(page, blocks)).toBe(true);
  });

  it('should return true for page with asterisk-only block', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [{ content: '*' }];

    expect(isPageEmpty(page, blocks)).toBe(true);
  });

  it('should return false for page with actual content', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [{ content: 'Some content' }];

    expect(isPageEmpty(page, blocks)).toBe(false);
  });

  it('should return false for journal pages', () => {
    const page = { name: '2025-11-03', 'journal?': true };
    const blocks = [];

    expect(isPageEmpty(page, blocks)).toBe(false);
  });

  it('should return false for logseq system pages', () => {
    const page = { name: 'logseq/config', 'journal?': false };
    const blocks = [];

    expect(isPageEmpty(page, blocks)).toBe(false);
  });

  it('should return false for pages with multiple blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = [
      { content: 'First block' },
      { content: 'Second block' }
    ];

    expect(isPageEmpty(page, blocks)).toBe(false);
  });

  it('should handle null blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = null;

    expect(isPageEmpty(page, blocks)).toBe(true);
  });

  it('should handle undefined blocks', () => {
    const page = { name: 'test-page', 'journal?': false };
    const blocks = undefined;

    expect(isPageEmpty(page, blocks)).toBe(true);
  });
});

describe('hasNoLinkedReferences', () => {
  it('should return true when references is null', () => {
    expect(hasNoLinkedReferences(null)).toBe(true);
  });

  it('should return true when references is undefined', () => {
    expect(hasNoLinkedReferences(undefined)).toBe(true);
  });

  it('should return true when references is empty array', () => {
    expect(hasNoLinkedReferences([])).toBe(true);
  });

  it('should return false when references has items', () => {
    expect(hasNoLinkedReferences([['some-page', []]])).toBe(false);
  });
});

describe('findOrphanedPages', () => {
  it('should find empty pages with no linked references', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'empty-page-1', 'journal?': false },
          { name: 'empty-page-2', 'journal?': false },
          { name: 'page-with-content', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn((pageName) => {
          if (pageName === 'page-with-content') {
            return Promise.resolve([{ content: 'Some content' }]);
          }
          return Promise.resolve([]);
        }),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['empty-page-1', 'empty-page-2']);
    expect(mockApi.Editor.getAllPages).toHaveBeenCalledOnce();
  });

  it('should not include empty pages that have linked references', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'empty-with-refs', 'journal?': false },
          { name: 'empty-no-refs', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn().mockResolvedValue([]),
        getPageLinkedReferences: vi.fn((pageName) => {
          if (pageName === 'empty-with-refs') {
            return Promise.resolve([['referencing-page', []]]);
          }
          return Promise.resolve([]);
        })
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['empty-no-refs']);
  });

  it('should skip journal pages', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: '2025-11-03', 'journal?': true },
          { name: 'empty-page', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn().mockResolvedValue([]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['empty-page']);
    expect(mockApi.Editor.getPageBlocksTree).toHaveBeenCalledTimes(1);
    expect(mockApi.Editor.getPageBlocksTree).toHaveBeenCalledWith('empty-page');
  });

  it('should skip logseq system pages', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'logseq/config', 'journal?': false },
          { name: 'logseq/pages', 'journal?': false },
          { name: 'empty-page', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn().mockResolvedValue([]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['empty-page']);
    expect(mockApi.Editor.getPageBlocksTree).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no empty pages found', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'page-with-content', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn().mockResolvedValue([{ content: 'Content' }]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
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
        getPageBlocksTree: vi.fn(),
        getPageLinkedReferences: vi.fn()
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual([]);
    expect(mockApi.Editor.getPageBlocksTree).not.toHaveBeenCalled();
    expect(mockApi.Editor.getPageLinkedReferences).not.toHaveBeenCalled();
  });

  it('should identify pages with dash-only content as empty if no refs', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'page-with-dash', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn().mockResolvedValue([{ content: '-' }]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['page-with-dash']);
  });

  it('should identify pages with asterisk-only content as empty if no refs', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'page-with-asterisk', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn().mockResolvedValue([{ content: '*' }]),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['page-with-asterisk']);
  });

  it('should handle API errors gracefully', async () => {
    const mockApi = {
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { name: 'error-page', 'journal?': false },
          { name: 'good-page', 'journal?': false }
        ]),
        getPageBlocksTree: vi.fn((pageName) => {
          if (pageName === 'error-page') {
            return Promise.reject(new Error('API error'));
          }
          return Promise.resolve([]);
        }),
        getPageLinkedReferences: vi.fn().mockResolvedValue([])
      }
    };

    const orphans = await findOrphanedPages(mockApi);

    expect(orphans).toEqual(['good-page']);
  });
});
