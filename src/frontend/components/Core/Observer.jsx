import React, { useCallback, useRef, useEffect } from 'react';

export function Observer({ onIntersect }) {
    let ref = useRef(null);

    useEffect(() => {
        let node = ref.current;
        if (node !== null) {
            let options = {
                root: null,
                rootMargin: '0px 0px 400px 0px',
                threshold: 0,
            };

            let observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        onIntersect();
                    }
                });
            }, options);

            observer.observe(node);
            return () => {
                observer.unobserve(node);
                observer.disconnect();
            };
        }
    }, [onIntersect]);

    return <div ref={ref} style={{ width: '100%', background: 'transparent', height: '1px', gridColumn: 1 }}></div>;
}
