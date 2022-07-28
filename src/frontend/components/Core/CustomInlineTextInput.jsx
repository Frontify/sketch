import React, { useRef, useEffect } from 'react';
export function CustomInlineTextInput({ value, onInput, onChange }) {
    const element = useRef(null);
    useEffect(() => {
        element.current.select();
    }, []);

    return (
        <input
            spellcheck="false"
            ref={element}
            type="text"
            variant="naked"
            value={value}
            onKeyDown={(event) => {
                switch (event.keyCode) {
                    // Enter
                    case 13:
                        onChange(event.target.value);
                        break;
                    // Escape
                    case 27:
                        onChange(null);
                        break;
                }
            }}
            onBlur={() => {
                onChange(null);
            }}
            onInput={(event) => onInput(event.target.value)}
        />
    );
}
