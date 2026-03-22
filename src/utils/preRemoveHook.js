const preRemoveHook = (refs) => {
    return async function (next) {
        const id = this._id;
        for (const { model, field } of refs) {
            const exists = await model.exists({ [field]: id });
            if (exists) {
                return next(new Error('Không thể xoá vì dữ liệu đang được tham chiếu ở nơi khác!'));
            }
        }
        next();
    };
};

module.exports = preRemoveHook;
