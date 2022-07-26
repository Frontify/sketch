import React from 'react';
import { useState } from 'react';
import { Button, Switch, Flyout, MenuItem, Text, IconImageLibrary } from '@frontify/fondue';

export function LibrariesSwitcher({ libraries, selection, onChange }) {
    const [open, setOpen] = useState(false);

    return (
        <Flyout
            hug={false}
            fitContent={true}
            isOpen={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            legacyFooter={false}
            trigger={
                <Button
                    border-radius="none"
                    icon={<IconImageLibrary />}
                    inverted={true}
                    style="Primary"
                    onClick={() => setOpen((open) => !open)}
                >
                    <Text size="x-small" whitespace="pre">
                        <custom-h-stack gap="x-small">
                            <span>Libraries</span>
                        </custom-h-stack>
                    </Text>
                </Button>
            }
        >
            <custom-v-stack separator="true">
                {libraries &&
                    libraries.length &&
                    libraries
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map((library) => {
                            return (
                                <div
                                    key={library.id}
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={library.name}
                                    onClick={() => {
                                        onChange(library);
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem
                                        active={selection.id == library.id}
                                        selectionIndicator="Check"
                                        title={library.name}
                                    >
                                        {library.name}
                                    </MenuItem>
                                </div>
                            );
                        })}
            </custom-v-stack>
        </Flyout>
    );
}
