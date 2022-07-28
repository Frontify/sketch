import React from 'react';
import { Logo } from '../Core/Logo';
export function BrowserHeader() {
    return '';
    return (
        <custom-h-stack padding="medium" justify-content="center" separator="bottom">
            {/* <Text>{context.selection.brand.name}</Text> */}
            <Logo size="72"></Logo>
        </custom-h-stack>
    );
}
