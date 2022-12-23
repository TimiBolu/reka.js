import { jsToYType } from '@composite/collaborative';
import { Composite } from '@composite/state';
import * as t from '@composite/types';

import * as Y from 'yjs';
import fs from 'fs';

import { DUMMY_PROGRAM } from '@app/constants/dummy-program';
import { Y_ROOT_DOCUMENT } from '@app/constants/yjs';
import { createSharedStateGlobals } from '@app/constants/shared-state-globals';

const doc = new Y.Doc();

const type = doc.getMap(Y_ROOT_DOCUMENT);

const composite = new Composite({
  ...createSharedStateGlobals(),
});

composite.load(
  t.state({
    program: DUMMY_PROGRAM,
    extensions: {},
  })
);

const flattenState = t.flatten(composite.state);

const { converted } = jsToYType(flattenState);

type.set('document', converted);

const update = Y.encodeStateAsUpdate(doc);

const encoded = Buffer.from(update).toString('base64');

fs.writeFileSync(
  './constants/encoded-dummy-program.ts',
  `export const ENCODED_DUMMY_PROGRAM = '${encoded}';`
);
