import ProTable from './components/ProTable/index.vue';
import type { ProTableProps, ProColumnData, ProTableRequestApi } from './components/ProTable/types';

import ProTableForm from './components/ProTableForm/index.vue';
import type { ProTableFormProps, ProTableFormColumn, ProTableFormRule, ProTableFormOption, ProTableFormExpose } from './components/ProTableForm/types';

import ProForm from './components/ProForm/index.vue';
import type { FormItemConfig, ProFormConfig, ProFormProps } from './components/ProForm/types';

import ProModal from './components/ProModal/index.vue';
import type { ProModalProps } from './components/ProModal/types';

import { SingleUpload, MultipleUpload, ProUpload, useUploadQueue, useOSS, createS3Uploader } from './components/ProUpload/index';
import type { OSSConfig, S3UploaderConfig } from './components/ProUpload/index';

export { ProTable, ProTableForm, ProForm, ProModal, SingleUpload, MultipleUpload, ProUpload, useUploadQueue, useOSS, createS3Uploader };
export type {
	ProTableProps,
	ProColumnData,
	ProTableRequestApi,
	ProTableFormProps,
	ProTableFormColumn,
	ProTableFormRule,
	ProTableFormOption,
	ProTableFormExpose,
	FormItemConfig,
	ProFormConfig,
	ProFormProps,
	ProModalProps,
	OSSConfig,
	S3UploaderConfig,
};
