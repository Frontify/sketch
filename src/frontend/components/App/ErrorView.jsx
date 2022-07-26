import React from 'react';

// Components
import { Button, FrontifyPattern, Heading, Text } from '@frontify/fondue';
import { Logo } from '../Core/Logo';

import { useTranslation } from 'react-i18next';

export function ErrorView({ description }) {
    const { t } = useTranslation();
    return (
        <custom-v-stack gap="large" padding="large" style={{ background: 'white' }}>
            <custom-v-stack gap="large" padding="large">
                <custom-spacer></custom-spacer>
                <Logo size="148"></Logo>
                <custom-spacer></custom-spacer>
                <Heading size="xx-large">{t('general.error')}</Heading>
                <Text>{description}</Text>
                <div>
                    <Button hugWidth={true} style="Secondary" onClick={() => window.location.reload()}>
                        {t('general.try_again')}
                    </Button>
                </div>
            </custom-v-stack>
            <div className="tw-fixed tw-bottom-0 tw-left-0 tw--z-1" style={{ zIndex: -1 }}>
                <div className="tw-w-100 tw-h-80">
                    <FrontifyPattern pattern="Imagery" foregroundColor="Green" scale="LG"></FrontifyPattern>
                </div>
            </div>
        </custom-v-stack>
    );
}
