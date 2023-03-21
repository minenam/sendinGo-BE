const { Users, Companies, sequelize } = require('../../db/models');
const { logger } = require('../../middlewares/logger');

class UserRepository {
  findUserByUserId = async ({ userId }) => {
    logger.info(`UserRepository.findUserByUserId Request`);
    const user = await Users.findOne({
      attributes: ['name', 'phoneNumber', 'email'],
      where: { userId },
    });

    return user;
  };
  createUser = async ({
    email,
    password,
    phoneNumber,
    provider,
    name,
    role,
    status,
    companyId,
  }) => {
    logger.info(`UserRepository.createUser Request`);
    await Users.create({
      email,
      password,
      phoneNumber,
      provider,
      name,
      role,
      status,
      companyId,
    });
    return;
  };

  createNewUserAndCompany = async ({
    email,
    password,
    companyName,
    companyEmail,
    companyNumber,
    companyEmail,
    phoneNumber,
    name,
    provider,
    role,
  }) => {
    try {
      const result = await sequelize.transaction(async (t) => {
        const newCompany = await Companies.create(
          { companyName, companyNumber, companyEmail },
          { transaction: t }
        );
        const newUser = await Users.create(
          {
            email,
            password,
            phoneNumber,
            provider,
            name,
            role,
            companyId: newCompany.companyId,
          },
          { transaction: t }
        );
      });

      return result;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  findUserByEmail = async ({ email }) => {
    logger.info(`UserRepository.findUser Request`);
    const user = await Users.findOne({ where: { email } });

    return user;
  };
  findByUserId = async ({ userId }) => {
    logger.info(`UserRepository.findUser Request`);
    const user = await Users.findOne({ where: { userId } });

    return user;
  };

  editUser = async ({ email, password, phoneNumber, name, userId }) => {
    logger.info(`UserRepository.editUser Request`);
    const updatedUser = await Users.update(
      { email, password, phoneNumber, name },
      { where: { userId } }
    );
    return updatedUser;
  };

  deleteUser = async ({ userId }) => {
    logger.info(`UserRepository.deleteUser Request`);

    await Users.destroy({ where: { userId } });
    return;
  };
}

module.exports = UserRepository;
