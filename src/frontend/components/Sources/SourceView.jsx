import React, { useContext, useEffect, useState } from 'react';

// Router
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

// Context
import { UserContext } from '../../context/UserContext';

// i18n
import { useTranslation } from 'react-i18next';

// Components
import { Slider } from '@frontify/fondue';
import { LoadingIndicator } from '../Core/LoadingIndicator';
import { NavigationBar } from '../App/NavigationBar';

export function SourceView() {
    const context = useContext(UserContext);

    const location = useLocation();
    const { t } = useTranslation();

    let [activeView, setActiveView] = useState('artboards');

    useEffect(() => {
        if (location.pathname.includes('artboards')) {
            setActiveView('artboards');
        } else {
            setActiveView('brand');
        }
    }, [location]);

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
            <custom-v-stack stretch padding-top="small" blocked={context.blocked}>
                {/* <Toolbar></Toolbar> */}
                <NavigationBar></NavigationBar>

                <custom-h-stack padding-bottom="medium" padding-top="small" padding-x="large">
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
                                    navigate(`/source/brand/${context.activeLibrary}`);
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
