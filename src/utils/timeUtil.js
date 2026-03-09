/* eslint-disable no-use-before-define */
const parseDatetime = (date) => {
    try {
        if (!date) return "";
        const formatDate = new Date(date);
        const HH = addZero(formatDate.getHours("HH"));
        const MM = addZero(formatDate.getMinutes());
        // let ss = addZero(formatDate.getSeconds());
        const dd = addZero(formatDate.getDate());
        // eslint-disable-next-line no-use-before-define
        const mm = addZero(formatDate.getMonth() + 1);

        const yy = formatDate.getFullYear();
        return `${dd}-${mm}-${yy} ${HH}:${MM}`;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
};
const getDataDate = (date) => {
    try {
        if (!date) return "";
        const formatDate = new Date(date);
        const hour = addZero(formatDate.getHours("HH"));
        const minute = addZero(formatDate.getMinutes());
        // let ss = addZero(formatDate.getSeconds());
        const day = addZero(formatDate.getDate());
        // eslint-disable-next-line no-use-before-define
        const month = addZero(formatDate.getMonth());

        const year = formatDate.getFullYear();
        return {
            hour, minute, day, month, year
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
};
const subDay = (date, day = 0) => {
    try {
        if (!date) return "";
        const formatDate = new Date(date);
        return formatDate.setDate(formatDate.getDate() - day);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        return null;
    }
}
function addZero(i) {
    if (i < 10) {
        // eslint-disable-next-line no-param-reassign
        i = `0${i}`;
    }
    return i;
}
module.exports = {
    parseDatetime,
    getDataDate,
    subDay
};