import React, { useEffect, useReducer } from 'react';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

import { Text } from '@frontify/arcade/foundation/typography/Text';
import { IconCaretDown, IconNotifications, IconRefresh } from '@frontify/arcade';

export function Toolbar() {
    const user = useContext(UserContext);
    // Test: Initial signOut
    useEffect(() => {
        user.signOut();
    }, []);
    return (
        <div>
            <button
                onClick={() => {
                    user.signIn();
                }}
            >
                signIn
            </button>
            <custom-toolbar-wrapper>
                <custom-h-stack gap="small" padding="x-small" align-items="center">
                    <custom-h-stack direction="row" spacing="small" gap="small" align-items="center">
                        <Text as="span" color="white" size="medium" weight="medium">
                            {user.name}
                        </Text>
                        <button>
                            <custom-h-stack gap="x-small">
                                <Text as="span" color="white" size="medium" weight="strong">
                                    {user.brand.name}
                                </Text>
                                <IconCaretDown></IconCaretDown>
                            </custom-h-stack>
                        </button>
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
