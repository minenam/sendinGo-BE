const { logger } = require('../../middlewares/logger');
const ClientService = require('../services/client.service');
const { BadRequestError } = require('../../exceptions/errors');

module.exports = class ClientController {
  constructor() {
    this.clientService = new ClientService();
  }

  // 클라이언트 등록
  createClient = async (req, res, next) => {
    logger.info(`ClientController.createClient Request`);
    // const { userId } = res.locals.users;
    const { clientName, contact, clientEmail } = req.body;

    try {
      const newClient = await this.clientService.createClient({
        //userId,
        clientName,
        contact,
        clientEmail,
      });

      return res.status(201).json({
        clientId: newClient.clientId,
        message: '등록이 완료되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  //클라이언트 전체 조회
  getAllClient = async (req, res, next) => {
    logger.info(`ClientController.getAllClient Request`);
    try {
      const allData = await this.clientService.getAllClient();

      return res.status(200).json({ data: allData });
    } catch (error) {
      next(error);
    }
  };

  //그룹별 클라이언트 조회
  getClientByGroup = async (req, res, next) => {
    logger.info(`ClientController.getClientByGroup Request`);
    const { groupId } = req.query;

    const result = await this.clientService.getClientByGroup({ groupId });

    res.status(200).json({ data: result });
  };

  //클라이언트 수정
  editClientInfo = async (req, res, next) => {
    logger.info(`ClientController.editClientInfo Request`);
    const { clientId } = req.params;
    const { clientName, contact } = req.body;

    try {
      if (!clientName || !contact) {
        throw new BadRequestError('정보를 입력해주세요.');
      }
      await this.clientService.editClientInfo({
        clientId,
        clientName,
        contact,
      });

      return res.status(200).json({ message: '수정이 완료되었습니다.' });
    } catch (error) {
      next(error);
    }
  };

  //클라이언트 삭제
  deleteClient = async (req, res, next) => {
    logger.info(`ClientController.deleteClient Request`);

    // const { userId } = res.locals.user;
    const { clientId } = req.params;
    try {
      await this.clientService.deleteClient({
        //userId,
        clientId,
      });

      return res.status(200).json({ message: '삭제가 완료되었습니다.' });
    } catch (error) {
      next(error);
    }
  };

  // 클라이언트 대량등록
  createClientBulk = async (req, res, next) => {
    logger.info(`ClientController.createClientBulk Request`);
    try {
      // const { userId } = res.locals.users;
      const { data } = req.body;
      if (!data || Object.keys(data).length === 0) {
        throw new BadRequestError('입력 값을 확인해주세요.');
      }

      const newClients = await this.clientService.createClientBulk({
        //userId,
        clientArray: data,
      });

      return res.status(201).json({
        newClients,
        message: '대량 등록이 완료되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };
};
