import React, { useEffect, useReducer } from 'react';
import { useContext, useState } from 'react';
import { UserContext } from '../UserContext';

import { Text } from '@frontify/arcade/foundation/typography/Text';
import { Button, Flyout, IconCaretDown, IconCheck, IconLogout, IconNotifications, IconRefresh } from '@frontify/arcade';

export function Toolbar() {
    const context = useContext(UserContext);
    const [open, setOpen] = useState(false);
    function logout() {
        window.postMessage('logout');
    }
    return (
        <div>
            <custom-toolbar-wrapper>
                <custom-h-stack gap="small" padding="x-small" align-items="center">
                    <custom-h-stack direction="row" align-items="center">
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
                                <Text onClick={() => setOpen((open) => !open)} color="white">
                                    <custom-h-stack gap="x-small">
                                        <button>
                                            <Text as="span" color="white" size="medium" weight="strong">
                                                {context.brands &&
                                                    context.brands.selected &&
                                                    context.brands.selected.name}
                                            </Text>
                                        </button>
                                        <IconCaretDown></IconCaretDown>
                                    </custom-h-stack>
                                </Text>
                            }
                        >
                            <custom-v-stack>
                                <custom-h-stack direction="row" gap="small" align-items="center" padding="small">
                                    <custom-avatar>
                                        <img src={context.user.avatar} alt={context.user.name} />
                                    </custom-avatar>

                                    <Text as="span" color="white" size="medium" weight="medium">
                                        {context.user.name}
                                    </Text>
                                    <custom-spacer></custom-spacer>
                                    <Button
                                        onClick={() => {
                                            logout();
                                        }}
                                    >
                                        Logout
                                    </Button>
                                </custom-h-stack>
                                <custom-line></custom-line>

                                <custom-v-stack gap="small" padding="small">
                                    {context.brands.entries &&
                                        context.brands.entries.map((brand) => {
                                            return (
                                                <custom-h-stack
                                                    key={brand.id}
                                                    gap="small"
                                                    onClick={() => {
                                                        context.brands.select(brand.id);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    {context.brands.selected?.id == brand.id && <IconCheck></IconCheck>}
                                                    {context.brands.selected?.id != brand.id && (
                                                        <div style={{ width: '16px' }}></div>
                                                    )}
                                                    <Text>{brand.name}</Text>
                                                </custom-h-stack>
                                            );
                                        })}
                                </custom-v-stack>
                            </custom-v-stack>
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
