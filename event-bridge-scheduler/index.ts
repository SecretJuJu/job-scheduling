import { config as dotenvConfig } from 'dotenv';
import {
  CreateScheduleCommand,
  CreateScheduleInput,
  SchedulerClient,
} from '@aws-sdk/client-scheduler';
import { v4 as uuid } from 'uuid';
import dayjs = require('dayjs');
import { FlexibleTimeWindowMode } from '@aws-sdk/client-scheduler/dist-types/models/models_0';

dotenvConfig(); // 환경변수 로드

const REGION = process.env.AWS_REGION!;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const SQS_QUEUE_ARN = process.env.SQS_QUEUE_ARN!;
const EVENT_BRIDGE_SQS_ROLE_ARN = process.env.EVENT_BRIDGE_SQS_ROLE_ARN!;
const SCHEDULER_GROUP = process.env.SCHEDULER_GROUP!;

const main = async () => {
  const schedulerClient = new SchedulerClient([
    {
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    },
  ]);

  const id = uuid();
  const afterMinutes = 5;
  const scheduleExpressionFormat = 'yyyy-mm-ddThh:mm:ss';
  const scheduleExpressionFormatDayjs = 'YYYY-MM-DDTHH:mm:ss';

  const createScheduleOptions: CreateScheduleInput = {
    FlexibleTimeWindow: {
      Mode: 'OFF' as FlexibleTimeWindowMode,
    },
    Name: `test-${id}`,
    State: 'ENABLED',
    ScheduleExpression: `at(${dayjs().add(afterMinutes, 'minute').format(scheduleExpressionFormatDayjs)})`,
    Target: {
      Arn: SQS_QUEUE_ARN,
      Input: JSON.stringify({ default: 'test' }),
      RoleArn: EVENT_BRIDGE_SQS_ROLE_ARN,
    },
    Description: 'test',
    GroupName: SCHEDULER_GROUP,
  };

  const createScheduleCommand = new CreateScheduleCommand(
    createScheduleOptions
  );

  const result = await schedulerClient.send(createScheduleCommand);
  console.log('schedule created', result);
};

main()
  .then(() => {
    console.log('done');
  })
  .catch((err) => {
    console.log(err);
  });
