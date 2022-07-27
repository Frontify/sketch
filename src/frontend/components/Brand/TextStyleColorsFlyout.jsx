import React, { useState } from 'react';
import { Button, Flyout, IconMore, MenuItem } from '@frontify/fondue';
import { Swatch } from './Swatch';

export function TextStyleColorsFlyout({ onChange, textStyle, colors, colorMap }) {
    const [openFlyout, setOpenFlyout] = useState(null);

    return (
        <Flyout
            hug={true}
            fitContent={true}
            isOpen={openFlyout}
            onOpenChange={(open) => {
                if (open) {
                    setOpenFlyout(true);
                } else {
                    setOpenFlyout(false);
                }
            }}
            legacyFooter={false}
            trigger={
                <Button
                    style="Secondary"
                    solid={false}
                    inverted={false}
                    icon={<IconMore />}
                    onClick={() => {
                        if (open) {
                            setOpenFlyout(true);
                        } else {
                            setOpenFlyout(false);
                        }
                    }}
                ></Button>
            }
        >
            <custom-v-stack>
                {Object.keys(textStyle.colors?.foreground)
                    .filter((key) => key != null)
                    .map((key) => (
                        <div
                            key={key}
                            tabIndex={0}
                            role="menuitem"
                            onClick={(event) => {
                                event.stopPropagation();
                                onChange(colorMap[key]);
                                setOpenFlyout(false);
                            }}
                        >
                            <MenuItem
                                title={colorMap[key]?.name}
                                decorator={<Swatch color={colorMap[key]?.css_value}></Swatch>}
                            >
                                {colorMap[key]?.name}
                            </MenuItem>
                        </div>
                    ))}
            </custom-v-stack>
        </Flyout>
    );
}
