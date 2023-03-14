import { ChatBubbleIcon, Pencil1Icon } from '@radix-ui/react-icons';
import * as t from '@rekajs/types';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import { useEditor } from '@app/editor';
import { EditorMode } from '@app/editor/Editor';

import { IconButton } from '../button';
import { Text } from '../text';
import { Tooltip } from '../tooltip';

type SelectionBorderProps = {
  dom: HTMLElement;
  template: t.Template;
  type: 'hovered' | 'selected';
};

const SelectionBorder = observer((props: SelectionBorderProps) => {
  const editor = useEditor();

  const activeComponentEditor = editor.activeComponentEditor;

  const containerDomRef = React.useRef<HTMLDivElement | null>(null);

  const iframe = editor.iframe;

  React.useEffect(() => {
    if (!iframe) {
      return;
    }

    if (!iframe) {
      return;
    }

    const { current: containerDom } = containerDomRef;

    if (!containerDom) {
      return;
    }

    const setPos = () => {
      const domRect = props.dom.getBoundingClientRect();

      const left = iframe.offsetLeft + domRect.left;
      const top = iframe.offsetTop + domRect.top;

      containerDom.style.opacity = '1';
      containerDom.style.left = Math.max(iframe.offsetLeft, left) + 'px';
      containerDom.style.top =
        Math.min(
          iframe.clientHeight + iframe.offsetTop,
          Math.max(iframe.offsetTop, top)
        ) + 'px';
      containerDom.style.height = domRect.height + 'px';
      containerDom.style.width = domRect.width + 'px';

      if (
        left < iframe.offsetLeft ||
        top <= iframe.offsetTop ||
        top >= iframe.clientHeight + iframe.offsetTop
      ) {
        containerDom.classList.add('overflow');

        if (!(top === 0 && left === 0)) {
          containerDom.classList.add('overflow-border-hidden');
        } else {
          containerDom.classList.remove('overflow-border-hidden');
        }

        if (top <= iframe.offsetTop) {
          containerDom.classList.add('overflow-top');
        } else {
          containerDom.classList.add('overflow-bottom');
        }

        return;
      }

      containerDom.classList.remove(
        'overflow',
        'overflow-border-hidden',
        'overflow-top',
        'overflow-bottom'
      );
    };

    setPos();

    const observer = new ResizeObserver(() => {
      setPos();
    });
    const observedEl = props.dom.parentElement ?? props.dom;
    observer.observe(observedEl);

    iframe.contentWindow?.addEventListener('scroll', setPos);

    return () => {
      observer.unobserve(observedEl);
      iframe.contentWindow?.removeEventListener('scroll', setPos);
    };
  }, [iframe, props.dom, props.template]);

  const templateName = React.useMemo(() => {
    if (props.template instanceof t.TagTemplate) {
      return props.template.tag;
    }

    if (props.template instanceof t.ComponentTemplate) {
      return props.template.component.name;
    }

    if (props.template instanceof t.SlotTemplate) {
      return '<slot>';
    }

    return 'Template';
  }, [props.template]);

  const templateType = React.useMemo(() => {
    if (props.template instanceof t.TagTemplate) {
      return 'tag';
    }

    if (props.template instanceof t.ComponentTemplate) {
      return 'component';
    }

    if (props.template instanceof t.SlotTemplate) {
      return 'slot';
    }

    return 'Unknown';
  }, [props.template]);

  if (!activeComponentEditor) {
    return null;
  }

  return (
    <div
      className="absolute z-max border border-solid border-primary pointer-events-none [&\.overflow\-border\-hidden]:border-transparent [&\.overflow\-top > div]:top-0 [&\.overflow\-bottom > div]:bottom-0"
      ref={containerDomRef}
    >
      <div
        className={classNames(
          'relative text-white px-3 py-1.5 text-sm h-6 -top-6 -left-px inline-block',
          {
            'bg-primary': props.type === 'selected',
            'bg-secondary': props.type === 'hovered',
          }
        )}
      >
        <div className="flex items-center">
          <div className="flex-1 flex items-center">
            <Text size={2}>{templateName}</Text>
            <Text css={{ ml: '$2', opacity: 0.7 }} size={1}>
              {'<'}
              {templateType}
              {'>'}
            </Text>
          </div>

          <div className="pl-3 flex items-center">
            {props.template instanceof t.ComponentTemplate && (
              <Tooltip
                content={
                  props.template.component.external
                    ? 'This is an external React component, it cannot be edited.'
                    : 'Edit component'
                }
              >
                <IconButton
                  disabled={props.template.component.external}
                  className="text-white hover:bg-slate-500"
                  onClick={() => {
                    const template = props.template;

                    if (!(template instanceof t.ComponentTemplate)) {
                      return;
                    }

                    if (template.component.external) {
                      return;
                    }

                    const component = editor.reka.components.program.find(
                      (component) => component.name === template.component.name
                    );

                    if (!component) {
                      return;
                    }

                    editor.setActiveComponentEditor(component);
                  }}
                >
                  <Pencil1Icon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip content="View comments">
              <IconButton
                className="text-white hover:bg-slate-500"
                onClick={() => {
                  activeComponentEditor.showComments(props.template);
                }}
              >
                <ChatBubbleIcon />
                {activeComponentEditor.getCommentCount(props.template) > 0 && (
                  <div className="ml-3 text-xs">
                    {editor.activeComponentEditor?.getCommentCount(
                      props.template
                    )}
                  </div>
                )}
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
});

type SelectionBordersProps = {
  template: t.Template;
  type: 'hovered' | 'selected';
};

const SelectionBorders = (props: SelectionBordersProps) => {
  const editor = useEditor();

  const doms =
    editor.activeComponentEditor?.activeFrame?.tplElements.get(
      props.template
    ) ?? [];

  return (
    <React.Fragment>
      {[...doms].map((dom, i) => (
        <SelectionBorder
          dom={dom}
          key={i}
          template={props.template}
          type={props.type}
        />
      ))}
    </React.Fragment>
  );
};

export const RenderSelectionBorders = observer(() => {
  const editor = useEditor();

  const activeComponentEditor = editor.activeComponentEditor;

  if (editor.mode === EditorMode.Preview) {
    return null;
  }

  if (!activeComponentEditor) {
    return null;
  }

  const activeFrame = activeComponentEditor.activeFrame;

  if (!activeFrame) {
    return null;
  }

  return (
    <React.Fragment>
      {activeComponentEditor.tplEvent.selected && (
        <SelectionBorders
          template={activeComponentEditor.tplEvent.selected}
          type="selected"
        />
      )}
      {activeComponentEditor.tplEvent.hovered &&
        activeComponentEditor.tplEvent.hovered.id !==
          activeComponentEditor.tplEvent.selected?.id && (
          <SelectionBorders
            template={activeComponentEditor.tplEvent.hovered}
            type="hovered"
          />
        )}
    </React.Fragment>
  );
});
