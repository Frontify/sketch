import React, { useContext, useState, useEffect } from 'react';

// Components
import {
    Button,
    Breadcrumbs,
    Flyout,
    IconMore,
    IconSketch,
    IconUploadAlternative,
    LoadingCircle,
    Text,
} from '@frontify/fondue';

// Hooks
import { useNavigate } from 'react-router-dom';
import { useSketch } from '../../hooks/useSketch';
import { useTranslation } from 'react-i18next';

// Context
import { UserContext } from '../../context/UserContext';

export function OpenDocumentsView() {
    let context = useContext(UserContext);

    let [openDocuments, setOpenDocuments] = useState([]);
    let navigate = useNavigate();
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

                                  <div
                                      onClick={() => {
                                          context.actions.openSource(source);
                                          navigate('/source/artboards');
                                      }}
                                  >
                                      <custom-v-stack key={source.id} style={{ pointerEvents: 'none' }}>
                                          <Breadcrumbs
                                              items={decodeURI(source.path)
                                                  .split('/')
                                                  .map((item) => {
                                                      return { label: item };
                                                  })}
                                          ></Breadcrumbs>
                                      </custom-v-stack>
                                  </div>
                                  <custom-spacer></custom-spacer>
                                  <custom-h-stack style={{ flex: 0 }} gap="small">
                                      <IconUploadAlternative
                                          size="Size20"
                                          onClick={() => {
                                              useSketch('moveCurrent');
                                          }}
                                      ></IconUploadAlternative>
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
