const { logger } = require('../../middlewares/logger');
const ClientRepository = require('../repositories/client.repository');
const TalkContentRepository = require('../repositories/talkcontent.repository');
const TalkTemplateRepository = require('../repositories/talktemplate.repository');
const TalkSendRepository = require('../repositories/talksend.repository');
const GroupRepository = require('../repositories/group.repository');
const AligoService = require('./aligo.service');
const { BadRequestError, NotFoundError } = require('../../exceptions/errors');
const TalkResultRepository = require('../repositories/talkresult.repository');
const aligoService = new AligoService();

module.exports = class AlimtalkService {
  constructor() {
    this.clientRepository = new ClientRepository();
    this.talkContentRepository = new TalkContentRepository();
    this.talkTemplateRepository = new TalkTemplateRepository();
    this.talkSendRepository = new TalkSendRepository();
    this.groupRepository = new GroupRepository();
    this.talkResultRepository = new TalkResultRepository();
  }

  // 알림톡 전송 내용 저장
  saveTalkContents = async ({
    clientId,
    talkTemplateCode,
    ...talkContentData
  }) => {
    logger.info(`AlimtalkService.saveTalkContents`);
    // 클라이언트 존재 확인
    const existClient = await this.clientRepository.getClientById({
      clientId,
    });
    if (!existClient) {
      throw new NotFoundError('클라이언트 조회에 실패하였습니다.');
    }

    // 템플릿 데이터 맞는지 확인하고 템플릿 Id 반환
    const talkTemplateId = await this.talkTemplateRepository
      .getTemplateByCode({
        talkTemplateCode,
      })
      .then(async (template) => {
        // 해당 템플릿 변수들 불러오기
        const variables =
          await this.talkTemplateRepository.getVariablesByTemplateId({
            talkTemplateId: template.talkTemplateId,
          });
        // 입력 데이터와 템플릿 변수 일치여부 확인
        const result = variables.every(async (value) => {
          const currentVariable = value['talkVariableEng'];
          const inputDataArray = Object.keys(talkContentData);
          return inputDataArray.includes(currentVariable);
        });
        if (!result) {
          throw new BadRequestError(
            '입력 데이터가 템플릿과 일치하지 않습니다.'
          );
        }
        return template.talkTemplateId;
      });

    // 템필릿 전송 내용 저장
    if (talkTemplateId) {
      const result = await this.talkContentRepository.createTalkContent({
        clientId,
        talkTemplateId,
        ...talkContentData,
      });
      return {
        talkContentId: result.talkContentId,
        clientId: result.clientId,
        talkTemplateId: result.talkTemplateId,
      };
    }
  };

  // 알림톡 발송
  sendAlimTalk = async (datas) => {
    logger.info(`AlimtalkService.sendAlimTalk`);

    let talkSendDatas = [];
    let talkSendParams = [];
    for (const data of datas) {
      const { talkContentId, clientId, talkTemplateId, groupId } = data;

      // clientId, talkContentId, talkTemplateId, groupId로 데이터 조회
      const talkSendPromises = [
        await this.clientRepository.getClientById({ clientId }),
        await this.talkContentRepository.getTalkContentById({ talkContentId }),
        await this.talkTemplateRepository.getTemplateById({ talkTemplateId }),
        await this.groupRepository.findGroupId({ groupId }),
      ];

      // 관련 Promise 에러 핸들링
      const talkSendPromiseData = await Promise.allSettled(talkSendPromises);
      const rawResult = talkSendPromiseData.map((result, idx) => {
        if (!result.value || result.status === 'rejected') {
          throw new NotFoundError(
            '클라이언트 or 전송내용 or 템플릿 조회를 실패하였습니다.'
          );
        }
        return result;
      });

      const [client, talkcontent, talkTemplate, group] = talkSendPromises;

      // 위 데이터로 알리고로 전송 요청을 위한 파라미터 만들기
      const talksendAligoParams = {
        talkTemplateCode: talkTemplate.talkTemplateCode,
        receiver: client.contact,
        recvname: client.clientName,
        subject: group.groupName,
        message: talkTemplate.talkTemplateContent,
        talkSendData: talkcontent,
      };
      talkSendDatas.push(talksendAligoParams);
    }

    // 파라미터로 알리고에 알림톡 전송 요청
    const aligoResult = await aligoService.sendAlimTalk(talkSendDatas);

    // 요청 받은 응답 데이터와 알림톡 전송 파라미터 반환
    for (const data of datas) {
      const { talkContentId, clientId, talkTemplateId, groupId } = data;
      const talkSend = { talkContentId, clientId, talkTemplateId, groupId };
      talkSendParams.push(talkSend);
    }
    return {
      message: '성공적으로 전송요청 하였습니다.',
      aligoResult,
      talkSend: [...talkSendParams],
    };
  };

  // 알림톡 발송 요청 응답 데이터 저장
  saveSendAlimTalkResponse = async ({ data }) => {
    logger.info(`AlimtalkService.saveSendAlimTalkResponse`);
    const { aligoResult, talkSend } = data;
    let result = [];
    for (const send of talkSend) {
      const { code, message } = aligoResult;
      const { talkContentId, clientId, talkTemplateId, groupId } = send;
      const newTalkSend = await this.talkSendRepository.createTalkSend({
        talkContentId,
        clientId,
        talkTemplateId,
        groupId,
        code,
        message,
        mid: aligoResult.info.mid,
        scnt: aligoResult.info.scnt,
        fcnt: aligoResult.info.fcnt,
      });
      result.push(newTalkSend);
    }
    return result;
  };

  // 알림톡 전송 결과 저장
  saveAlimTalkResult = async (results) => {
    logger.info(`AlimtalkService.saveAlimTalkResult`);

    try {
      let response = [];
      for (const result of results) {
        const { mid, msgCount, msgContent, sendState, sendDate } = result;
        // 존재하는 전송 결과인지 확인
        const existTalkSend = await this.talkSendRepository.getTalkSendById({
          mid,
        });
        // 존재하는 경우에만 해당 전송 결과 데이터 업데이트
        if (existTalkSend) {
          const updatedDataCount =
            await this.talkSendRepository.updateTalkSendResult({
              mid: existTalkSend.mid,
              msgCount,
              msgContent,
              sendState,
              sendDate,
            });

          response.push(existTalkSend);
        }
      }
      return response;
    } catch (e) {
      console.error(e);
    }
  };

  // 알림톡 전송 상세 결과 저장
  saveTalkResultDetail = async ({ results, talkSendData }) => {
    logger.info(`AlimtalkService.saveTalkResultDetail`);

    const { talkSendId, clientId } = talkSendData;

    let response = [];
    for (const result of results) {
      const { msgid } = result;
      const existTalkResult =
        await this.talkResultRepository.getExistTalkResult({
          msgid,
        });
      if (!existTalkResult) {
        // 원하는 데이터만 찾아서 push
        const talkResult = await this.talkResultRepository.getTalkResultByMsgId(
          {
            msgid: talkResultData.msgid,
          }
        );
        response.push(talkResult);
      } else {
        // talkResult 생성

        const talkResultData = await this.talkResultRepository.createTalkResult(
          {
            ...result,
            talkSendId,
          }
        );
        // talkResultClient 생성
        const newTalkResultClient =
          await this.talkResultRepository.createTalkResultClient({
            clientId,
            talkResultDetailId: talkResultData.talkResultDetailId,
            talkSendId,
          });

        const talkResult = await this.talkResultRepository.getTalkResultByMsgId(
          {
            msgid: talkResultData.msgid,
          }
        );
        response.push(talkResult);
      }
    }
    return response;
  };

  // mid로 전송 데이터 FK 조회
  getTalkSendByGroupId = async ({ groupId }) => {
    logger.info(`AlimtalkService.getTalkSendByGroupId`);

    // talkTemplateId, ClientId, talkSendId 찾기
    const talkSend = await this.talkSendRepository.getTalkSendByGroupId({
      groupId,
    });
    if (!talkSend) {
      throw new NotFoundError('해당하는 전송 데이터를 찾을 수 없습니다.');
    }
    const talkSendResultData = {
      talkSendId: talkSend.talkSendId,
      clientId: talkSend.clientId,
      talkTemplateId: talkSend.talkTemplateId,
      mid: talkSend.mid,
    };
    return talkSendResultData;
  };

  // msgid로 결과 상세 데이터 조회
  getExistedTalkResult = async ({ msgid }) => {
    logger.info(`AlimtalkService.getExistedTalkResult`);

    const talkResult = await this.talkResultRepository.getExistTalkResult({
      msgid,
    });

    return talkResult;
  };
};
