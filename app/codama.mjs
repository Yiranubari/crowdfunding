import { readFileSync } from 'fs';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';

const idl = JSON.parse(readFileSync('../target/idl/crowdfunding.json', 'utf-8'));
const codama = createFromRoot(rootNodeFromAnchor(idl));

const outDir = 'src/client/generated';
codama.accept(
  renderVisitor(outDir, {
    generatedFolder: '.',
    deleteFolderBeforeRendering: true,
    syncPackageJson: false,
  }),
);

console.log(`✓ Generated program client in ${outDir}/`);
