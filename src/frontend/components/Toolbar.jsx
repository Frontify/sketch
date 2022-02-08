import React, { useEffect, useReducer } from 'react';
import { useContext, useState } from 'react';
import { UserContext } from '../UserContext';

import { Text } from '@frontify/arcade/foundation/typography/Text';
import { Button, Flyout, IconCaretDown, IconCheck, IconNotifications, IconRefresh } from '@frontify/arcade';

export function Toolbar() {
    const context = useContext(UserContext);
    const [open, setOpen] = useState(false);
    return (
        <div>
            <custom-toolbar-wrapper>
                <custom-h-stack gap="small" padding="x-small" align-items="center">
                    <custom-h-stack direction="row" gap="small" align-items="center">
                        <custom-avatar>
                            <img src={context.user.avatar} alt={context.user.name} />
                        </custom-avatar>

                        <Text as="span" color="white" size="medium" weight="medium">
                            {context.user.name}
                        </Text>

                        <Flyout
                            hug={true}
                            fitContent={true}
                            isOpen={open}
                            onOpenChange={(isOpen) => setOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button onClick={() => setOpen((open) => !open)}>
                                    <custom-h-stack gap="x-small">
                                        <Text as="span" color="white" size="medium" weight="strong">
                                            {context.brands.selected && context.brands.selected.name}
                                        </Text>
                                        <IconCaretDown></IconCaretDown>
                                    </custom-h-stack>
                                </Button>
                            }
                        >
                            <div padding="small">
                                <custom-v-stack gap="small">
                                    {context.brands.entries &&
                                        context.brands.entries.map((brand) => {
                                            return (
                                                <custom-h-stack
                                                    gap="small"
                                                    onClick={() => {
                                                        context.brands.select(brand.id);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    {context.brands.selected.id == brand.id && <IconCheck></IconCheck>}
                                                    {context.brands.selected.id != brand.id && (
                                                        <div style={{ width: '16px' }}></div>
                                                    )}
                                                    <Text>{brand.name}</Text>
                                                </custom-h-stack>
                                            );
                                        })}
                                </custom-v-stack>
                            </div>
                        </Flyout>
                    </custom-h-stack>
                    <custom-spacer></custom-spacer>
                    <button>
                        <IconNotifications icon="Notifications" size="Size20" />
                    </button>
                    <button>
                        <IconRefresh icon="Refresh" size="Size20" />
                    </button>
                </custom-h-stack>
            </custom-toolbar-wrapper>
        </div>
    );
}
