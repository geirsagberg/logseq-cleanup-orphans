function isPageEmpty(page, blocks) {
  if (page['journal?'] || page.name.startsWith('logseq/')) {
    return false;
  }

  if (!blocks || blocks.length === 0) {
    return true;
  }

  if (blocks.length === 1) {
    const content = blocks[0].content;
    if (!content || content.trim() === '' || content.trim() === '-' || content.trim() === '*') {
      return true;
    }
  }

  return false;
}

async function findOrphanedPages(api) {
  const allPages = await api.Editor.getAllPages();
  const orphanedPages = [];

  for (const page of allPages) {
    if (page['journal?'] || page.name.startsWith('logseq/')) {
      continue;
    }

    const blocks = await api.Editor.getPageBlocksTree(page.name);

    if (isPageEmpty(page, blocks)) {
      orphanedPages.push(page.name);
    }
  }

  return orphanedPages;
}

async function removeOrphanedPages() {
  try {
    logseq.UI.showMsg('Scanning for orphaned pages...', 'info');

    const orphanedPages = await findOrphanedPages(logseq);

    if (orphanedPages.length === 0) {
      logseq.UI.showMsg('No orphaned pages found!', 'success');
      return;
    }

    const confirmed = await logseq.UI.confirm(
      `Found ${orphanedPages.length} orphaned page${orphanedPages.length > 1 ? 's' : ''}. Delete ${orphanedPages.length > 1 ? 'them' : 'it'}?`,
      'Cleanup Orphaned Pages',
      { confirmButtonLabel: 'Delete', cancelButtonLabel: 'Cancel' }
    );

    if (confirmed) {
      for (const pageName of orphanedPages) {
        await logseq.Editor.deletePage(pageName);
      }
      logseq.UI.showMsg(
        `Successfully deleted ${orphanedPages.length} orphaned page${orphanedPages.length > 1 ? 's' : ''}!`,
        'success'
      );
    } else {
      logseq.UI.showMsg('Cleanup cancelled', 'info');
    }
  } catch (error) {
    console.error('Error removing orphaned pages:', error);
    logseq.UI.showMsg(`Error: ${error.message}`, 'error');
  }
}

function main() {
  console.log('Cleanup Orphans Plugin loaded');

  logseq.App.registerCommandPalette({
    key: 'cleanup-orphaned-pages',
    label: 'Cleanup: Remove orphaned pages',
    keybinding: {
      binding: 'mod+shift+o',
      mode: 'global'
    }
  }, async () => {
    await removeOrphanedPages();
  });

  logseq.provideModel({
    async removeOrphans() {
      await removeOrphanedPages();
    }
  });

  logseq.App.registerUIItem('toolbar', {
    key: 'cleanup-orphans-button',
    template: `
      <a data-on-click="removeOrphans" class="button" title="Remove orphaned pages (Cmd/Ctrl+Shift+O)">
        <i class="ti ti-trash"></i>
      </a>
    `
  });
}

if (typeof logseq !== 'undefined') {
  logseq.ready(main).catch(console.error);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isPageEmpty, findOrphanedPages };
}
