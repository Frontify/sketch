import React from 'react';

import { Stack } from '@frontify/arcade/foundation/layout/Stack';
import { Text } from '@frontify/arcade/foundation/typography/Text';
import { IconCaretDown, IconNotifications, IconRefresh } from '@frontify/arcade';

export class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            brand: {
                name: 'Monobrand',
            },
            user: {
                name: 'Shen Zi',
            },
        };
    }

    render() {
        return (
            <div>
                <custom-toolbar-wrapper>
                    <custom-h-stack gap="small" padding="x-small" align-items="center">
                        <custom-h-stack direction="row" spacing="small" gap="small" align-items="center">
                            <Text as="span" color="white" size="medium" weight="medium">
                                {this.state.user.name}
                            </Text>
                            <button>
                                <custom-h-stack gap="x-small">
                                    <Text as="span" color="white" size="medium" weight="strong">
                                        {this.state.brand.name}
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
}
