const { Client } = require('../../db/models');

module.exports = class ClientRepository {
  constructor() {}
  // 클라이언트 생성
  createClient = async (userId, clientName, contact) => {
    const createData = await Client.createClient(userId, clientName, contact);
    return createData;
  };

  //클라이언트 전체 조회
  getAllClient = async (userId) => {
    const allData = await Client.findAll({
      where: { userId },
      attributes: ['clientid', 'clientName', 'contact', 'createdAt'],
    });
    return allData;
  };

  //클라이언트 삭제
  deleteClient = async (clientId) => {
    const deleteData = await Client.destroy({
      where: { clientId },
    });
    return deleteData;
  };
};
