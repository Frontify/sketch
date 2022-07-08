import React, { useContext, useEffect } from 'react';

// Router
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

// Hooks
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Context
import { UserContext } from '../../context/UserContext';

// i18n
import { useTranslation } from 'react-i18next';

// Components
import { Slider, Text } from '@frontify/fondue';
import { LoadingIndicator } from '../Core/LoadingIndicator';
import { NavigationBar } from '../App/NavigationBar';
import { Toolbar } from '../App/Toolbar';

export function SourceView() {
    const context = useContext(UserContext);

    const location = useLocation();
    const { t } = useTranslation();

    let [activeView, setActiveView] = useLocalStorage('cache.activeView', 'brand');
    let [activeScope, setActiveScope] = useLocalStorage('cache.activeScope', 'colors');

    const navigate = useNavigate();

    let sliderItems = [
        {
            id: 'artboards',
            value: t('general.uploads'),
        },
        {
            id: 'brand',
            value: t('general.brand'),
        },
    ];

    if (context.user?.name) {
        return (
            <custom-v-stack stretch>
                {/* <Toolbar></Toolbar> */}
                <NavigationBar></NavigationBar>

                <custom-h-stack padding="medium" padding-x="large">
                    <Slider
                        items={sliderItems}
                        activeItemId={activeView}
                        onChange={(value) => {
                            setActiveView(value);
                            switch (value) {
                                case 'artboards':
                                    navigate(`/source/artboards`);
                                    break;
                                case 'brand':
                                    navigate(`/source/brand/${activeScope}`);
                            }
                        }}
                    ></Slider>
                </custom-h-stack>

                <custom-line></custom-line>
                <Outlet />
            </custom-v-stack>
        );
    } else {
        return <LoadingIndicator />;
    }
}
