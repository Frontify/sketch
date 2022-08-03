import React from 'react';

export function Swatch({ color, swatchSize }) {
    switch (swatchSize) {
        case 'Small':
            return (
                <div
                    className="tw-w-4 tw-h-4 tw-rounded"
                    style={{ backgroundColor: color, border: '1px solid rgba(0, 0, 0, 0.12' }}
                ></div>
            );
        default:
            return (
                <div
                    className="tw-w-6 tw-h-6 tw-rounded"
                    style={{ backgroundColor: color, border: '1px solid rgba(0, 0, 0, 0.12' }}
                ></div>
            );
    }
}
