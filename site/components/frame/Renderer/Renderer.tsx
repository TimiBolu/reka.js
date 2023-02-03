import { toJS } from '@rekajs/core';
import { observer } from '@rekajs/react';
import * as t from '@rekajs/types';
import { invariant } from '@rekajs/utils';
import * as React from 'react';

import { useEditor, useEditorActiveComponent } from '@app/editor';
import { EditorMode } from '@app/editor/Editor';
import { requestAnimationSequence } from '@app/utils';

type ComponentContextType = {
  component: t.Component;
  root: t.Component;
  parentComponent?: t.Component;
};

const ComponentContext = React.createContext<ComponentContextType>(null as any);

type SlotContextType = {
  parentComponent?: t.Component;
};

const SlotContext = React.createContext<SlotContextType>(null as any);

type SelectorContextType = {
  onConnect: (dom: HTMLElement, view: t.View) => (() => void) | undefined;
};

const SelectorContext = React.createContext<SelectorContextType>(null as any);

type RenderErrorViewProps = {
  view: t.ErrorSystemView;
};

const RenderErrorView = observer((props: RenderErrorViewProps) => {
  return (
    <div>
      <h4>Error: {props.view.error}</h4>
    </div>
  );
});

type RenderTagViewProps = {
  view: t.TagView;
};

const RenderTagView = observer((props: RenderTagViewProps) => {
  const { onConnect } = React.useContext(SelectorContext);

  const domRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const { current: dom } = domRef;

    if (!dom) {
      return;
    }

    return onConnect(dom, props.view);
  }, [onConnect, props.view]);

  if (props.view.tag === 'text') {
    return <span ref={domRef}>{props.view.props.value as string}</span>;
  }

  return React.createElement(
    props.view.tag,
    {
      ...props.view.props,
      style: props.view.props.style ? toJS(props.view.props.style) : {},
      ref: domRef,
    },
    props.view.children.length > 0
      ? props.view.children.map((child) => (
          <InternalRenderer view={child} key={child.key} />
        ))
      : undefined
  );
});

type RenderSlotViewProps = {
  view: t.SlotView;
};

export const RenderSlotView = observer((props: RenderSlotViewProps) => {
  const { parentComponent } = React.useContext(ComponentContext);

  const activeComponentEditor = useEditorActiveComponent();

  return (
    <SlotContext.Provider value={{ parentComponent }}>
      <SelectorContext.Provider
        value={{
          onConnect: (dom, view) => {
            if (!parentComponent) {
              if (props.view.children.indexOf(view) > -1) {
                return activeComponentEditor.connectTplDOM(
                  dom,
                  props.view.template,
                  true
                );
              }

              return;
            }

            return activeComponentEditor.connectTplDOM(
              dom,
              view.template,
              true
            );
          },
        }}
      >
        {props.view.children.map((v) => (
          <InternalRenderer key={v.id} view={v} />
        ))}
      </SelectorContext.Provider>
    </SlotContext.Provider>
  );
});

type RenderExternalComponentViewProps = {
  view: t.ExternalComponentView;
};

const RenderExternalComponentView = (
  props: RenderExternalComponentViewProps
) => {
  const { onConnect } = React.useContext(SelectorContext);

  const element = React.useMemo(() => {
    return props.view.component.render(props.view.props);
  }, [props.view.component]);

  return React.cloneElement(element, {
    ref: (dom: HTMLElement) => {
      if (!dom) {
        return;
      }

      return onConnect(dom, props.view);
    },
  });
};

type RenderComponentViewProps = {
  view: t.ComponentView;
};

const RenderComponentView = observer((props: RenderComponentViewProps) => {
  const componentContext = React.useContext(ComponentContext);
  const slotContext = React.useContext(SlotContext);

  const activeComponentEditor = useEditorActiveComponent();

  return (
    <SelectorContext.Provider
      value={{
        onConnect: (dom, view) => {
          if (!componentContext) {
            return activeComponentEditor.connectTplDOM(
              dom,
              view.template,
              true
            );
          }

          if (
            slotContext?.parentComponent !== componentContext.root &&
            componentContext.component !== componentContext.root
          ) {
            return;
          }

          if (
            (props.view instanceof t.RekaComponentView &&
              props.view.render.indexOf(view) > -1) ||
            props.view instanceof t.ExternalComponentView
          ) {
            if (
              props.view instanceof t.ExternalComponentView &&
              slotContext &&
              componentContext.parentComponent !== slotContext.parentComponent
            ) {
              return;
            }

            return activeComponentEditor.connectTplDOM(
              dom,
              props.view.template,
              true
            );
          }
        },
      }}
    >
      <ComponentContext.Provider
        value={{
          root: componentContext?.root ?? props.view.component,
          parentComponent: componentContext?.component,
          component: props.view.component,
        }}
      >
        {props.view instanceof t.ExternalComponentView ? (
          <RenderExternalComponentView view={props.view} />
        ) : props.view instanceof t.RekaComponentView ? (
          props.view.render.map((r) => <InternalRenderer view={r} key={r.id} />)
        ) : null}
      </ComponentContext.Provider>
    </SelectorContext.Provider>
  );
});

type RendererProps = {
  view: t.View;
};

const InternalRenderer = observer((props: RendererProps) => {
  const view = props.view;

  if (view instanceof t.TagView) {
    return <RenderTagView view={view} />;
  }

  if (view instanceof t.ComponentView) {
    return <RenderComponentView view={view} />;
  }

  if (view instanceof t.ErrorSystemView) {
    return <RenderErrorView view={view} />;
  }

  if (view instanceof t.SlotView) {
    return <RenderSlotView view={view} />;
  }

  return null;
});

export const Renderer = observer((props: RendererProps) => {
  const view = props.view;

  const editor = useEditor();

  React.useEffect(() => {
    if (editor.ready) {
      return;
    }

    requestAnimationSequence([
      [() => editor.setReady(true), 200],
      [() => editor.setMode(EditorMode.UI), 400],
    ]);
  }, [editor]);

  invariant(view instanceof t.RekaComponentView, 'Unexpected root view');

  const activeFrameEditor = useEditorActiveComponent();

  invariant(activeFrameEditor, 'No active editor');

  return <InternalRenderer view={view} />;
});
