import React from 'react';
import { useContext } from 'react';

import { Link } from 'react-router-dom';
import { SearchField } from './SearchField';

import { Button, Breadcrumbs, Flyout, IconSketch, Text, IconUploadAlternative, IconPen } from '@frontify/arcade';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';

export function RecentDocumentsView() {
    let [activeScope] = useLocalStorage('cache.activeScope', 'colors');

    let { sources } = useContext(UserContext);

    const { t } = useTranslation();

    return (
        <custom-v-stack stretch>
            <div padding="small">
                <SearchField></SearchField>
            </div>
            <custom-line></custom-line>
            <custom-scroll-view stretch style={{ overflowX: 'hidden', width: '100%' }}>
                {/* Recent Documents */}
                {sources.map((source) => {
                    return (
                        <custom-h-stack
                            gap="medium"
                            align-items="start"
                            separator="bottom"
                            padding="small"
                            key={source.id}
                        >
                            <div>
                                <IconSketch size="Size24"></IconSketch>
                            </div>

                            <custom-v-stack key={source.id}>
                                <Breadcrumbs
                                    items={
                                        source.localpath
                                            ? source.localpath.split('/').map((item) => {
                                                  return { label: item };
                                              })
                                            : []
                                    }
                                ></Breadcrumbs>

                                <Text>{source.state}</Text>

                                {source.state == 'addable' ? <Text>{source.filename}</Text> : ''}
                                <Link to={`/source/artboards/${activeScope}`}>
                                    <Text>{source.modifier_name}</Text>
                                    <Text>{source.modified_localized_ago}</Text>
                                </Link>
                            </custom-v-stack>

                            <div>
                                {source.state == 'addable' && (
                                    <Button
                                        onClick={() => {
                                            useSketch('addSource', { source });
                                        }}
                                        icon={<IconUploadAlternative />}
                                    ></Button>
                                )}

                                {source.state == 'same' && (
                                    <Button
                                        onClick={() => {
                                            useSketch('openSource', { source });
                                        }}
                                        icon={<IconPen />}
                                    ></Button>
                                )}

                                {source.state == 'push' && (
                                    <Button
                                        onClick={() => {
                                            useSketch('addSource', source);
                                        }}
                                        icon={<IconUploadAlternative />}
                                    ></Button>
                                )}
                            </div>
                        </custom-h-stack>
                    );
                })}
            </custom-scroll-view>

            <custom-v-stack>
                <custom-line></custom-line>

                <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center">
                    <Flyout
                        trigger={
                            <Button
                                style="Secondary"
                                onClick={() => {
                                    console.log('click');
                                }}
                            >
                                {t('sources.browse_all')}
                            </Button>
                        }
                        isOpen={false}
                        onOpenChange={(isOpen) => {}}
                        legacyFooter={false}
                    >
                        <custom-v-stack padding="small" gap="small">
                            <Text>{t('sources.browse_all')}</Text>
                        </custom-v-stack>
                    </Flyout>
                    <Button style="Primary">{t('sources.sync_all')}</Button>
                </custom-h-stack>
            </custom-v-stack>
        </custom-v-stack>
    );
}
