import {
    Button,
    Breadcrumbs,
    Flyout,
    IconMore,
    IconSketch,
    IconUploadAlternative,
    LoadingCircle,
    Text,
} from '@frontify/arcade';
import { useNavigate } from 'react-router-dom';
import React from 'react';

import { useSketch } from '../hooks/useSketch';

import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';

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
            <custom-scroll-view padding="small" style={{ background: 'lavender' }}>
                <h2>🚧 List of open Sketch files</h2>
                <p>
                    Here, we should see a list of open Sketch files. Each file knows the{' '}
                    <strong>remote_project_id & remote_id </strong> – otherwise, the file is new and not tracked on
                    Frontify.
                </p>
                <br />
                <h2>Remote status</h2>
                <p>
                    The problem is, that the upload is done via API v1. But the ID returned by the API has a different
                    format compared to a GraphQL upload.
                </p>

                <br />

                <h2>API v1: </h2>
                <p>
                    remote_project_id: <pre>191277</pre>
                    <br />
                    remote_id: <pre>6405542</pre>
                </p>
                <br />
                <h2>GraphQL</h2>

                <p>
                    remote_project_id: <pre>eyJpZGVudGlmaWVyIjoxOTA3NDEsInR5cGUiOiJwcm9qZWN0In0=</pre>
                    <br />
                    remote_id: <pre>eyJpZGVudGlmaWVyIjo2MzcwNDgyLCJ0eXBlIjoiYXNzZXQifQ==</pre>
                </p>
                <br />

                <p>
                    Fetching information about open files is possible via the old API. But it’s hacky because the
                    endpoint doesn’t seem to support an ID?
                </p>
                <br />
                <p>
                    Also, the depth needs to be really high to get a complete list of files that we can then filter on
                    the client. Not ideal.
                </p>
                <pre>/v1/assets/status/PROJECT_ID?include_screen_activity=true&depth=999999&ext=sketchs</pre>
                <p>---</p>
            </custom-scroll-view>
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
