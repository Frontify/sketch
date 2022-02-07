import React, { useEffect, useReducer } from 'react';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

import { Text } from '@frontify/arcade/foundation/typography/Text';
import { IconCaretDown, IconNotifications, IconRefresh } from '@frontify/arcade';

export function Toolbar() {
    const context = useContext(UserContext);

    return (
        <div>
            <custom-toolbar-wrapper>
                <custom-h-stack gap="small" padding="x-small" align-items="center">
                    <custom-h-stack direction="row" spacing="small" gap="small" align-items="center">
                        <custom-avatar>
                            <img src={context.user.avatar} alt={context.user.name} />
                        </custom-avatar>

                        <Text as="span" color="white" size="medium" weight="medium">
                            {context.user.name}
                        </Text>
                        <button>
                            <custom-h-stack gap="x-small">
                                <Text as="span" color="white" size="medium" weight="strong">
                                    {context.brands.selected && context.brands.selected.name}
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
