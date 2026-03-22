/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (object, keys) => {
    return keys.reduce((obj, key) => {
        if (object && Object.hasOwn(object, key)) {
            // eslint-disable-next-line no-param-reassign
            let value = object[key];

            if (typeof value === "string") {
                value = value.trim();
                if (value === "") return obj; // bỏ key rỗng
            }

            obj[key] = value;

        }
        return obj;
    }, {});
};

module.exports = pick;