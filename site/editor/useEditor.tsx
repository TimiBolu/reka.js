import { invariant } from '@rekajs/utils';
import * as React from 'react';

import { EditorContext } from './EditorContextProvider';

export const useEditor = () => React.useContext(EditorContext);

export const useEditorActiveComponent = () => {
  const editor = useEditor();
  invariant(editor.activeComponentEditor, 'No active Component Editor');
  return editor.activeComponentEditor;
};
