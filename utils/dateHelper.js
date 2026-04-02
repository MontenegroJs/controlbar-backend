/**
 * Helper para manejo de fechas en zona horaria de Perú (UTC-5)
 */

// Zona horaria de Perú (UTC-5)
const TIMEZONE_OFFSET = -5; // horas

// Obtener fecha actual en hora de Lima
const getLimaDate = () => {
    const now = new Date();
    const limaTime = new Date(now.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
    return limaTime;
};

// Obtener fecha actual en formato ISO para SQLite
const getLimaDateTime = () => {
    const now = new Date();
    const limaTime = new Date(now.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
    return limaTime.toISOString().slice(0, 19).replace('T', ' ');
};

// Convertir fecha a formato YYYY-MM-DD en hora Lima
const getLimaDateString = (date = null) => {
    const targetDate = date ? new Date(date) : new Date();
    const limaTime = new Date(targetDate.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
    return limaTime.toISOString().split('T')[0];
};

// Formatear fecha para SQLite (YYYY-MM-DD HH:MM:SS)
const formatForSQLite = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const limaTime = new Date(d.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
    return limaTime.toISOString().slice(0, 19).replace('T', ' ');
};

// Obtener el inicio del día en hora Lima (YYYY-MM-DD 00:00:00)
const getStartOfDay = (dateString) => {
    return `${dateString} 00:00:00`;
};

// Obtener el fin del día en hora Lima (YYYY-MM-DD 23:59:59)
const getEndOfDay = (dateString) => {
    return `${dateString} 23:59:59`;
};

module.exports = {
    getLimaDate,
    getLimaDateTime,
    getLimaDateString,
    formatForSQLite,
    getStartOfDay,
    getEndOfDay,
    TIMEZONE_OFFSET
};