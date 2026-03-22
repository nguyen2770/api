const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User, RolePermissionModel } = require('../models');
const CompanyModel = require('../models/users/company.model');
const CompanySettingModel = require('../models/common/companySetting.model');
const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
    try {
        if (payload.type !== tokenTypes.ACCESS) {
            throw new Error('Invalid token type');
        }
        const user = await User.findById(payload.sub);
        if (!user) {
            return done(null, false);
        }
        const company = await CompanyModel.findById(user.company);
        const companySetting = await CompanySettingModel.findOne();
        const rolePermissions = await RolePermissionModel.find({ role: user.role }).populate([
            {
                path: 'permission',
            },
        ]);
        done(null, {
            user,
            company,
            rolePermissions,
            companySetting,
        });
    } catch (error) {
        done(error, false);
    }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
    jwtStrategy,
};
