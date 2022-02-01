import React from 'react';

import { Stack } from '@frontify/arcade/foundation/layout/Stack';
import { Text } from '@frontify/arcade/foundation/typography/Text';
import { IconNotifications, IconRefresh } from '@frontify/arcade';

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
                        <Stack direction="row" spacing="small">
                            <Text as="span" color="white" size="medium" weight="medium">
                                {this.state.user.name}
                            </Text>
                            <Text as="span" color="white" size="medium" weight="strong">
                                {this.state.brand.name}
                            </Text>
                        </Stack>
                        <custom-spacer></custom-spacer>
                        <IconNotifications icon="Notifications" size="Size24" />
                        <IconRefresh icon="Refresh" size="Size24" />
                    </custom-h-stack>
                </custom-toolbar-wrapper>
            </div>
        );
    }
}
