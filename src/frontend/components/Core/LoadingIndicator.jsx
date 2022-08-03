import React from 'react';
import nook from '../../assets/images/nook-animated.gif';

export function LoadingIndicator() {
    return (
        <div padding="small" style={{ height: '100%', flex: 1, width: '100%', display: 'grid', placeItems: 'center' }}>
            <custom-v-stack align-items="center" gap="large">
                <img src={nook} width="64" />
            </custom-v-stack>
        </div>
    );
}
