import React, { useEffect, useReducer } from 'react';
import { useContext, useState } from 'react';
import { UserContext } from '../UserContext';

import { Text } from '@frontify/arcade';
import { Button, Flyout, IconCaretDown, IconCheck, IconLogout, IconNotifications, IconRefresh } from '@frontify/arcade';

export function Toolbar() {
    const context = useContext(UserContext);
    const [open, setOpen] = useState(false);
    function logout() {
        context.actions.logout();
        window.postMessage('logout');
    }
    return (
        <div>
            <custom-toolbar-wrapper>
                <custom-h-stack gap="small" padding="xx-small" align-items="center">
                    <custom-h-stack direction="row" align-items="center">
                        {/* <Text as="span" color="white" size="medium" weight="medium">
                            {context.user.name}
                        </Text> */}

                        {/* 
                            This element steals the focus so that the next real element gets the focus after a first "tab" key press. 
                            This is for aesthetic reasons only because the focus state of the following "Flyout / Button" doesn’t look very nice. 
                        */}
                        <custom-focus-trap tabindex="0"></custom-focus-trap>

                        <Flyout
                            hug={false}
                            fitContent={true}
                            isOpen={open}
                            onOpenChange={(isOpen) => setOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button onClick={() => setOpen((open) => !open)} size="Small">
                                    <custom-h-stack gap="small">
                                        <Text as="span" color="white" size="medium" weight="strong">
                                            {context.brands && context.selection.brand && context.selection.brand.name}
                                        </Text>
                                        <IconCaretDown></IconCaretDown>
                                    </custom-h-stack>
                                </Button>
                            }
                        >
                            <custom-v-stack>
                                <custom-h-stack direction="row" gap="small" align-items="center" padding="small">
                                    {context.user.avatar && (
                                        <custom-avatar>
                                            <img src={context.user.avatar} alt={context.user.name} />
                                        </custom-avatar>
                                    )}

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

                                <custom-v-stack>
                                    <custom-h-stack padding="x-small">
                                        <Text weight="strong">Brands</Text>
                                    </custom-h-stack>
                                    {context.brands.length == 0 && <Text>No brands</Text>}
                                    {context.brands &&
                                        context.brands.length &&
                                        context.brands.map((brand) => {
                                            return (
                                                <custom-palette-item
                                                    key={brand.id}
                                                    gap="small"
                                                    onClick={() => {
                                                        context.actions.selectBrand(brand);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <custom-h-stack gap="x-small">
                                                        {context.selection.brand?.id == brand.id && (
                                                            <IconCheck></IconCheck>
                                                        )}
                                                        {context.selection.brand?.id != brand.id && (
                                                            <div style={{ width: '16px' }}></div>
                                                        )}
                                                        <Text size="small">{brand.name}</Text>
                                                    </custom-h-stack>
                                                </custom-palette-item>
                                            );
                                        })}
                                </custom-v-stack>
                            </custom-v-stack>
                        </Flyout>
                    </custom-h-stack>
                    <custom-spacer></custom-spacer>
                    {/* <button>
                        <IconNotifications icon="Notifications" size="Size20" />
                    </button> */}

                    <button
                        onClick={() => {
                            window.postMessage('reload');
                        }}
                    >
                        <IconRefresh icon="Refresh" size="Size20" />
                    </button>
                </custom-h-stack>
            </custom-toolbar-wrapper>
        </div>
    );
}
