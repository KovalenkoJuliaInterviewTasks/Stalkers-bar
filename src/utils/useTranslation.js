import { useSelector } from 'react-redux';

const LANG_SUFFIX = { EN: 'En', RU: 'Ru', HE: 'He' };
const LOCALES = { EN: 'en-US', RU: 'ru-RU', HE: 'he-IL' };

export const useTranslation = () => {
    const lang = useSelector(state => state.lang.lang);
    const suffix = LANG_SUFFIX[lang] ?? 'Ru';

    const getLabel = (item) => item[`title${suffix}`] ?? item.titleRu;
    const getDesc = (item) => item[`desc${suffix}`] ?? item.descRu;
    const getLocale = () => LOCALES[lang] ?? 'ru-RU';
    const formatDate = (isoDate) => new Date(isoDate).toLocaleDateString(getLocale(), {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    return { lang, getLabel, getDesc, getLocale, formatDate };
};
