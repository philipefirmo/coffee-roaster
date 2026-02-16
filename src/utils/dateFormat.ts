/**
 * Formata data para DD/MM/YY
 */
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

/**
 * Formata data para DD/MM/YYYY (versão longa)
 */
export const formatDateLong = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Retorna data de hoje formatada DD/MM/YY
 */
export const getTodayFormatted = (): string => {
    return formatDate(new Date());
};

/**
 * Converte data no formato ISO (YYYY-MM-DD) para Date
 */
export const parseISODate = (isoDate: string): Date => {
    return new Date(isoDate + 'T00:00:00');
};
