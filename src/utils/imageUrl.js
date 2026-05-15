const extractDriveId = (ref) => {
    const fileMatch = ref.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return fileMatch[1];
    const idMatch = ref.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];
    return null;
};

export const getImageUrl = (ref) => {
    if (!ref) return '';
    if (ref.startsWith('https://') || ref.startsWith('http://')) {
        if (ref.includes('drive.google.com')) {
            const id = extractDriveId(ref);
            if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
        }
        return ref;
    }
    if (ref.includes('.')) return `/images/${ref}`;
    return `https://drive.google.com/thumbnail?id=${ref}&sz=w1000`;
};
