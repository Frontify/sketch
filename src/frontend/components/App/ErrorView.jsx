import React, { useContext } from 'react';

// Components
import { Button, FrontifyPattern, Heading, Text } from '@frontify/fondue';
import { Logo } from '../Core/Logo';
import { UserContext } from '../../context/UserContext';

import { useTranslation } from 'react-i18next';

export function ErrorView({ title, description, errors }) {
    const context = useContext(UserContext);
    const { t } = useTranslation();
    return (
        <div>
            <custom-dialog>
                <custom-dialog-content>
                    <custom-v-stack gap="large" padding="large">
                        <custom-v-stack gap="large" padding="large">
                            <custom-spacer></custom-spacer>
                            <Logo size="148"></Logo>
                            <custom-spacer></custom-spacer>
                            <Heading size="xx-large">{title}</Heading>
                            <Text>{description}</Text>
                            <div>
                                <Button
                                    hugWidth={true}
                                    style="Secondary"
                                    onClick={() => {
                                        context.actions.clearErrors();
                                        window.location.reload();
                                    }}
                                >
                                    {t('general.try_again')}
                                </Button>
                            </div>
                        </custom-v-stack>
                        <div className="tw-absolute tw-left-0 tw-bottom-0  tw--z-1">
                            <div className=" tw-h-80" style={{ width: 'calc(100vw - 400px)' }}>
                                <FrontifyPattern pattern="Imagery" foregroundColor="Green" scale="LG"></FrontifyPattern>
                            </div>
                        </div>
                    </custom-v-stack>
                </custom-dialog-content>
            </custom-dialog>
        </div>
    );
}
