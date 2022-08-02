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
                    <custom-v-stack gap="large" padding="large" style={{ position: 'relative' }}>
                        <custom-v-stack gap="large" padding="large">
                            <custom-spacer></custom-spacer>
                            <Logo size="148"></Logo>
                            <custom-spacer></custom-spacer>
                            <Heading size="xx-large">{title}</Heading>
                            <Text>
                                <code>{description}</code>
                            </Text>
                            <custom-h-stack gap="small">
                                <Button
                                    hugWidth={true}
                                    style="Secondary"
                                    onClick={() => {
                                        context.actions.clearErrors();
                                        window.location.href = '/';
                                        window.location.reload();
                                    }}
                                >
                                    {t('general.try_again')}
                                </Button>

                                <Button
                                    hugWidth={true}
                                    inverted={true}
                                    onClick={() => {
                                        context.actions.logout();
                                        window.location.reload();
                                    }}
                                >
                                    {t('general.sign_out')}
                                </Button>
                            </custom-h-stack>
                        </custom-v-stack>
                        {/* <custom-spacer></custom-spacer>
                        <div className="tw-absolute tw-bottom-0 tw--z-1" style={{ left: '12px' }}>
                            <div className=" tw-h-80" style={{ width: 'calc(100vw - 400px)' }}>
                                <FrontifyPattern pattern="Imagery" foregroundColor="Green" scale="LG"></FrontifyPattern>
                            </div>
                        </div> */}
                    </custom-v-stack>
                </custom-dialog-content>
            </custom-dialog>
        </div>
    );
}
