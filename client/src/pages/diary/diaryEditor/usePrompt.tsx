import { useContext, useEffect } from 'react';
import {UNSAFE_NavigationContext as NavigationContext, Location} from 'react-router-dom';

export function usePrompt(
    when: boolean,
    callback: (location: Location) => boolean
) {
    const navigator = useContext(NavigationContext).navigator;

    useEffect(() => {
        if (!when) return;

        const push = navigator.push;

        navigator.push = (to: string | Location, options?: { replace?: boolean; state?: any }) => {
            const location = typeof to === 'string' ? { pathname: to, search: '', hash: '', state: options?.state, key: '' } : to;

            const result = callback(location);
            if (result) {
                push(to, options);
            }
        };

        return () => {
            navigator.push = push;
        };
    }, [when, callback, navigator]);
}
