import { Parser } from '@rekajs/parser';
import * as t from '@rekajs/types';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { Info } from '../info';
import { TextField } from '../text-field';

type TextareaEditorProps = {
  initialValue?: t.Expression | null;
  onClose: () => void;
  onCommit: (value: t.Expression) => void;
};

const TextareaEditor = ({
  onClose,
  onCommit,
  initialValue,
  ...props
}: TextareaEditorProps) => {
  const prevInitialValueRef = React.useRef(initialValue);

  const [value, setValue] = React.useState(
    initialValue ? Parser.stringify(initialValue) : ''
  );
  const [hasError, setHasError] = React.useState('');
  const domRef = React.useRef<HTMLTextAreaElement | null>(null);

  const valueRef = React.useRef(value);
  valueRef.current = value;

  const onCommitRef = React.useRef(onCommit);
  onCommitRef.current = onCommit;

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    const { current: prevInitialValue } = prevInitialValueRef;

    if (prevInitialValue === initialValue) {
      return;
    }

    prevInitialValueRef.current = initialValue;
    setValue(initialValue ? Parser.stringify(initialValue) : '');
  }, [setValue, initialValue]);

  const commit = React.useCallback(() => {
    const { current: onCommit } = onCommitRef;
    const { current: onClose } = onCloseRef;
    const { current: value } = valueRef;

    if (!value) {
      onClose();

      return;
    }

    try {
      onCommit(Parser.parseExpression(value));
      onClose();
    } catch (err) {
      setHasError(String(err));
    }
  }, [setHasError]);

  React.useEffect(() => {
    const { current: dom } = domRef;

    if (!dom) {
      return;
    }

    dom.focus();
    dom.setSelectionRange(dom.value.length, dom.value.length);

    const listener = (e: any) => {
      if (dom.contains(e.target as any) === true) {
        return;
      }

      commit();
    };

    const parent = dom.closest('[role="dialog"]') ?? window;

    parent.addEventListener('mousedown', listener);

    return () => {
      parent.removeEventListener('mousedown', listener);
    };
  }, [commit]);

  return (
    <div
      className={classNames(
        'absolute -top-px -left-px z-40 border border-solid border-transparent rounded overflow-hidden shadow-xl w-[calc(100%+1px)] bg-white',
        {
          'border-red-300 rounded-bl-none rounded-br-none': hasError,
        }
      )}
    >
      <TextareaAutosize
        className="w-full text-xs p-3 outline-none resize-none"
        {...props}
        value={value}
        ref={domRef}
        onChange={(e) => {
          setValue(e.target.value);
          setHasError('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
        }}
      />
      <div className="px-3 py-3 flex">
        <div className="text-[0.6rem] py-1 px-3 border border-solid border-secondary/20 text-secondary flex rounded-full items-center justify-center self-start">
          Expression
          <Info
            info={`An expression is expected here. Eg: "Some text value" for text literals.`}
          />
        </div>
      </div>
      {hasError && (
        <div className="text-xs relative w-full px-3 py-3 bg-red-400 text-white z-2">
          {hasError}
        </div>
      )}
    </div>
  );
};

type ExpressionInputProps = {
  value: t.Expression | null | undefined;
  placeholder?: string;
  disable?: boolean;
  onCommit?: (value: t.Expression) => void;
  onCancel?: () => void;
  inputClassName?: string;
};

export const ExpressionInput = observer(
  ({
    value,
    disable,
    placeholder,
    onCommit,
    onCancel,
    inputClassName,
  }: ExpressionInputProps) => {
    const [showTextareaEditor, setShowTextareaEditor] = React.useState(false);

    return (
      <div className="relative w-full">
        <TextField
          className={inputClassName}
          value={value ? Parser.stringify(value) : ''}
          onChange={() => {
            return;
          }}
          onFocus={() => {
            setShowTextareaEditor(true);
          }}
          onCancel={onCancel}
          disabled={disable}
          placeholder={placeholder}
        />

        {showTextareaEditor && (
          <TextareaEditor
            initialValue={value}
            onCommit={(value) => {
              if (!value || !onCommit) {
                return;
              }

              onCommit(value);
            }}
            onClose={() => {
              setShowTextareaEditor(false);
            }}
          />
        )}
      </div>
    );
  }
);
