import { Button, Flyout, IconMore, IconSketch, IconUploadAlternative, LoadingCircle, Text } from '@frontify/arcade';
import { Link } from 'react-router-dom';
import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSketch } from '../hooks/useSketch';

import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';

export function OpenDocumentsView() {
    let context = useContext(UserContext);

    let [activeScope] = useLocalStorage('cache.activeScope', 'colors');
    let [openDocuments, setOpenDocuments] = useState([]);
    const { t } = useTranslation();

    let [loading, setLoading] = useState(false);

    useEffect(async () => {
        setLoading(true);
        let { documents } = await useSketch('getOpenDocuments');
        setLoading(false);

        setOpenDocuments([...documents]);
    }, []);

    if (loading) {
        return (
            <custom-v-stack flex padding="small" align-items="center" justify-content="center">
                <LoadingCircle></LoadingCircle>
            </custom-v-stack>
        );
    }

    return (
        <custom-v-stack stretch>
            <custom-scroll-view stretch style={{ overflowX: 'hidden', width: '100%' }}>
                {openDocuments && openDocuments.length
                    ? openDocuments.map((source) => {
                          return (
                              <custom-h-stack
                                  gap="small"
                                  align-items="center"
                                  separator="bottom"
                                  padding="small"
                                  key={source.id}
                              >
                                  <div style={{ flex: 0 }}>
                                      <IconSketch size="Size24"></IconSketch>
                                  </div>

                                  <Link to={`/source/artboards`} style={{ overflow: 'hidden' }}>
                                      <custom-v-stack key={source.id}>
                                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              <Text size="x-small" color="weak">
                                                  {source.path
                                                      .split('/')
                                                      .slice(0, [source.path.split('/').length - 1])
                                                      .join('/')}
                                              </Text>
                                          </div>
                                          <Text>
                                              {decodeURI(source.path.split('/')[source.path.split('/').length - 1])}
                                          </Text>
                                      </custom-v-stack>
                                  </Link>
                                  <custom-spacer></custom-spacer>
                                  <custom-h-stack style={{ flex: 0 }} gap="small">
                                      <IconUploadAlternative size="Size20"></IconUploadAlternative>
                                      <IconMore size="Size20"></IconMore>
                                  </custom-h-stack>
                              </custom-h-stack>
                          );
                      })
                    : ''}
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
