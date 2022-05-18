import React from 'react';

export function Swatch({ color }) {
    return (
        <div
            className="tw-w-6 tw-h-6 tw-rounded"
            style={{ backgroundColor: color, border: '1px solid rgba(0, 0, 0, 0.12' }}
        ></div>
    );
}
